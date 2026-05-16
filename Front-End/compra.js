
/* Aqui o JS captura os elementos do HTML */

const formularioCompra = document.querySelector('#form-compra');
const produtoCompra = document.querySelector('#produto-compra');
const quantidadeCompra = document.querySelector('#quantidade-compra');
const resumoItem = document.querySelector('#resumo-item');
const resumoQuantidade = document.querySelector('#resumo-quantidade');
const resumoTotal = document.querySelector('#resumo-total');
const mensagemCompra = document.querySelector('#mensagem-compra');

/* O let é um array que vai guardar os produtos vindo o backend */

let produtosDisponiveis = [];

/* Formatador de Moeda */

const moedaCompra = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

/* Função responsável por pegar o produto escohido no <select> */

function obterProdutoSelecionado() {
  const opcao = produtoCompra.selectedOptions[0];

  if (!opcao || !opcao.value) {
    return null;
  }

  return {
    id: Number(opcao.value),
    nome: opcao.textContent.split(' - ')[0],
    preco: Number(opcao.dataset.preco)
  };
}

/* Essa função pega o produto selecionado e a quantidade */
/* Se o usuário apagar o valor, vira 0 */
/* Se não houve produto selecioando (!produto) ele retorna um 0*/
/* O resultado final é a multiplicação entre produto.preco e quantidade selecionada */

function calcularTotal() {
  const produto = obterProdutoSelecionado();
  const quantidade = Number(quantidadeCompra.value) || 0;

  if (!produto) {
    return 0;
  }

  return produto.preco * quantidade;
}

/* Essa função cuida apena da interface visual */
/* Se houver um produto selecionado ele informa o nome, se não só um '-' */
/* O text content troca o texto da página html em tempo real */
/* Ela usa a função anterior para calcular o preço total */

function atualizarResumoCompra() {
  const produto = obterProdutoSelecionado();
  const quantidade = Number(quantidadeCompra.value) || 0;

  resumoItem.textContent = produto ? produto.nome : '-';
  resumoQuantidade.textContent = quantidade;
  resumoTotal.textContent = moedaCompra.format(calcularTotal());
}

/* Aqui começa a conexão do cliente com o servidor */
/* preventDefault impede o reload da página */
/* Criação do objeto compra, com todos os dados da compra */
/* Isso é um DTO -> Data Transfer Object */

async function enviarCompra(evento) {
  evento.preventDefault();

  const produto = obterProdutoSelecionado();
  const dados = new FormData(formularioCompra);
  const compra = {
    comprador_nome: dados.get('comprador_nome').trim(),
    produto_id: produto ? produto.id : null,
    quantidade: Number(dados.get('quantidade')),
    forma_pagamento: dados.get('forma_pagamento'),
    observacao: dados.get('observacao').trim()
  };
/* Validação */
  if (!compra.comprador_nome || !compra.produto_id || compra.quantidade < 1) {
    mensagemCompra.textContent = 'Confira os dados da compra antes de confirmar.';
    return;
  }
    /* Agora o sistema conversa com o back (requisição HTTP) */
    /* O Método POST cria um registro */
    /* Content-Type informa queo corpo da requisição é JSON */
  try {
    const resposta = await fetch('/api/compras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(compra)  /* Converte o objeto JS em JSON textual */
    });

    if (!resposta.ok) {
      throw new Error('Sem resposta do servidor');
    }

    mensagemCompra.textContent = 'Compra registrada com sucesso.';
    await carregarProdutos();
  } catch (erro) {
    mensagemCompra.textContent = 'Falha na comunicação com o servidor';
  }

  formularioCompra.reset();
  quantidadeCompra.value = 1;
  atualizarResumoCompra();
}

/* Essa função monta o <select> dinamicamente */

function preencherProdutos(produtos) {
  produtoCompra.innerHTML = '<option value="">Selecione</option>';

  produtos.forEach((produto) => {
    const opcao = document.createElement('option');
    opcao.value = produto.id;
    opcao.dataset.preco = produto.preco;
    opcao.textContent = `${produto.nome} - ${moedaCompra.format(Number(produto.preco))}`;
    opcao.disabled = produto.quantidade < 1;
    produtoCompra.appendChild(opcao);
  });
}

/* Busca de produtos da API */

async function carregarProdutos() {
  try {
    const resposta = await fetch('/api/produtos');

    if (!resposta.ok) {
      throw new Error('Falha ao carregar produtos.');
    }

    produtosDisponiveis = await resposta.json();
  } catch (erro) {
    produtosDisponiveis = [
      { id: 1, nome: 'Refrigerante lata', preco: 5.00, quantidade: 0 },
      { id: 2, nome: 'Agua mineral', preco: 3.00, quantidade: 0 },
      { id: 3, nome: 'Chocolate', preco: 4.50, quantidade: 0 }
    ];
    mensagemCompra.textContent = 'Servidor indisponivel. Produtos carregados apenas para visualizacao.';
  }

  preencherProdutos(produtosDisponiveis);
  atualizarResumoCompra();
}

produtoCompra.addEventListener('change', atualizarResumoCompra);
quantidadeCompra.addEventListener('input', atualizarResumoCompra);
formularioCompra.addEventListener('submit', enviarCompra);

carregarProdutos();
