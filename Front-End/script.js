const produtos = [   /*Constante chamada produtos, [] é um array (lista de itens) */
  {
    nome: 'Refrigerante lata',
    descricao: '350 ml',
    quantidade: 0,
    preco: 5.00
  },
  {
    nome: 'Agua mineral',
    descricao: '500 ml',
    quantidade: 0,
    preco: 3.00
  },
  {
    nome: 'Chocolate',
    descricao: 'Unidade',
    quantidade: 0,
    preco: 4.50
  }  /* As vígurlas separam um objeto do outro -> {}, */
];

/*A partir daqui o js procura um elemento HTML pelo ID(#) */
/*Document representa toda a página hmtl */
/*queryselector é um método usado par buscar elementos na página */

const formulario = document.querySelector('#form-produto');
const campoBusca = document.querySelector('#busca-produto');
const tabelaProdutos = document.querySelector('#tabela-produtos');
const tabelaCompras = document.querySelector('#tabela-compras');
const botaoAtualizarCompras = document.querySelector('#atualizar-compras');
const totalItens = document.querySelector('#total-itens');
const totalUnidades = document.querySelector('#total-unidades');
const valorEstoque = document.querySelector('#valor-estoque');

/*Criação de um formatador de moeda brasileira */
/*intl.numberformat é uma ferramenta para formatar números */
/*pt-br define o padrão brasileiro */
/*Currency diz que o número será exibido como dinheiro */

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

/*Essa função percebe um texto e "padroniza" ele para permitir buscas sem problemas com erros gráficos */

function normalizarTexto(texto) {
  return texto
    .toLowerCase()  /*minúsculo */
    .normalize('NFD') /*Separa letras dos acentos */
    .replace(/[\u0300-\u036f]/g, ''); /*Comando que remove os acentos separados */
}

/*Função responsável por verificar qnt. do estoque e retorna o status do produto */

function obterStatus(quantidade) {
  if (quantidade === 0) {
    return {
      texto: 'Sem estoque',
      classe: 'status-baixo'
    };
  }

  if (quantidade <= 5) {
    return {
      texto: 'Estoque baixo',
      classe: 'status-atencao'
    };
  }

  return {
    texto: 'Disponivel',
    classe: 'status-ok'
  };
}

/*Função que atualiza os indicadores do sistema */
/*reduce() percorre um array inteiro acumulando valor. O 0 é o valor inicial do acumulador*/

function atualizarResumo() {
  const unidades = produtos.reduce((total, produto) => total + produto.quantidade, 0);
  const valorTotal = produtos.reduce(
    (total, produto) => total + produto.quantidade * produto.preco,
    0
  );

  totalItens.textContent = produtos.length;
  totalUnidades.textContent = unidades;
  valorEstoque.textContent = moeda.format(valorTotal);
}

/*Função responsável pela criação de uma linha html */
/*Const status chama a função anterior que verifica o status */
/*Cont linha cria uma linha da tabela, o 'tr' fica na memória, não precisa repetir. E as aspas permitem inserir o código html */
/*O $ permite escrever JS dentro do html */
/*Adiciona a classe definida na func.status acima */

function criarLinhaProduto(produto) {
  const status = obterStatus(produto.quantidade);
  const linha = document.createElement('tr');

  linha.innerHTML = `
    <td>${produto.nome}</td>
    <td>${produto.descricao || '-'}</td>
    <td>${produto.quantidade}</td>
    <td>${moeda.format(produto.preco)}</td>
    <td><span class="status ${status.classe}">${status.texto}</span></td>
  `;

  return linha;
}

/*Essa função recebe uma data e formata para o padrão brasileiro*/
/*INTL é uma ferramenta para formatar datas */
/*'short' mostra a data curta */

function formatarData(data) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(data));
}

/*Funnção que cria compras na tabela html */

function criarLinhaCompra(compra) {
  const linha = document.createElement('tr');

  linha.innerHTML = `
    <td>${compra.comprador_nome}</td>
    <td>${compra.produto_nome}</td>
    <td>${compra.quantidade}</td>
    <td>${moeda.format(Number(compra.valor_total))}</td>
    <td>${compra.forma_pagamento}</td>
    <td>${formatarData(compra.criado_em)}</td>
  `;

  return linha;
}

/* Busca o produto pesquisado pelo usuário */
/* Normaliza o texto digitado */
/* Filtra o array */
/* Atualiza a tela */

function renderizarProdutos() {
  const termoBusca = normalizarTexto(campoBusca.value.trim());
  const produtosFiltrados = produtos.filter((produto) => {
    const nome = normalizarTexto(produto.nome);
    const descricao = normalizarTexto(produto.descricao || '');

    return nome.includes(termoBusca) || descricao.includes(termoBusca);
  });

  tabelaProdutos.innerHTML = '';

  if (produtosFiltrados.length === 0) {
    const linhaVazia = document.createElement('tr');
    linhaVazia.innerHTML = '<td colspan="5" class="sem-resultados">Nenhum item encontrado.</td>';
    tabelaProdutos.appendChild(linhaVazia);
    return;
  }

  produtosFiltrados.forEach((produto) => {
    tabelaProdutos.appendChild(criarLinhaProduto(produto));
  });
}

/* Essa função pega dados do formulário e adiciona um novo objeto ao array */
/* Prevent impede o comportamento padrão do fomulário que é recarregar a página, assim os dados seriam perdidos */
/* FormData é uma ferramenta que lê os campos do formulário */
/* novoProduto -> criação de um novo objeto produto, campo por campo */
/* !novoProduto.nome -> verifica se o nome está vazio */
/* Number.isNaN -> "is not a number". Se algo estiver errado a função para imediatamente "return" */
/* Isso é o processo de validação de formulário */
/* .push() adiciona o iten ao array */
/* .reset limpa os campos, deixa vazio como padrão (UX) */

function cadastrarProduto(evento) {
  evento.preventDefault();

  const dados = new FormData(formulario);
  const novoProduto = {
    nome: dados.get('nome').trim(),
    descricao: dados.get('descricao').trim(),
    quantidade: Number(dados.get('quantidade')),
    preco: Number(dados.get('preco'))
  };

  if (!novoProduto.nome || Number.isNaN(novoProduto.quantidade) || Number.isNaN(novoProduto.preco)) {
    return;
  }

  produtos.push(novoProduto);
  formulario.reset();
  formulario.quantidade.value = 0;
  atualizarTela();
}


/*  Esta última parte é o motor da aplicação */

/* atualizarResumo e renderizarProdutos -> centralizam as atualizações da interface. Deixa mais prático */

function atualizarTela() {
  atualizarResumo();
  renderizarProdutos();
}

/* Comunicação com o servidor/API */
/* Sem o async o JS travaria esperando a resposta -> "Carregando últimas compras..." */

async function carregarCompras() {
  tabelaCompras.innerHTML = '<tr><td colspan="6" class="sem-resultados">Carregando ultimas compras...</td></tr>';

/* Requisição em HTTP (fetch) + await -> que faz esperar a resposta chegar */
/* O if verifica se a requisição deu certo */
  try {
    const resposta = await fetch('/api/compras');

    if (!resposta.ok) {
      throw new Error('Falha ao carregar compras.');
    }

/* Aqui a API devolve o texto JSON */
/* Se não  houver compras registradas vai aparecer a mensagem abaixo */

    const compras = await resposta.json();
    tabelaCompras.innerHTML = '';

    if (compras.length === 0) {
      tabelaCompras.innerHTML = '<tr><td colspan="6" class="sem-resultados">Nenhuma compra registrada ainda.</td></tr>';
      return;
    }

/* Percorre cada compra do awway */
/* Para cada compra cria-se uma linha HTML e adiciona na tabela */
/* O catch captura os erros do try */

    compras.forEach((compra) => {
      tabelaCompras.appendChild(criarLinhaCompra(compra));
    });
  } catch (erro) {
    tabelaCompras.innerHTML = '<tr><td colspan="6" class="sem-resultados">Inicie o servidor para ver as compras atualizadas do banco.</td></tr>';
  }
}

/* Aqui ocorre a criação dos eventos cadastrar prouto, renderizar e carregar as compras */

formulario.addEventListener('submit', cadastrarProduto);
campoBusca.addEventListener('input', renderizarProdutos);
botaoAtualizarCompras.addEventListener('click', carregarCompras);

/* Inicialização do sistema */

atualizarTela();
carregarCompras();
