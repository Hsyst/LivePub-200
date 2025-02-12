# Tutorial de Uso
Caso apenas queira realizar o download e execução do LivePub, clique aqui!

# Download
Caso queira realizar o download do LivePub, clique aqui!

# LivePub - Documentação Técnica
## Índice:
- Sobre o LivePub
- Requisitos
- Funcionamento
  - Explicação do HLS (Nginx)
  - Explicação das APIs (NodeJS - Feito por nós)
- Configuração do Nginx
- Configuração do LivePub
  - Versão SSL
  - Versão Comum
- Endpoints
- Fluxos
- Créditos
- Finalização
- Licença

---
---

## Sobre o LivePub
O LivePub, é uma plataforma de Transmissão Ao-Vivo gratuita, utilizando as tecnologias RTMP e HLS para realizar a transmissão, NodeJS (JavaScript), JavaScript (puro), HTML, e Bootstrap para o site e API e dentre outras tecnologias. O objetivo e democratizar e facilitar a criação de um ambiente de streaming para sua empresa ou para uso pessoal!

---

O LivePub pode ser utilizado por exemplo, em sua empresa para transmitir eventos privados e restritos. E para uso pessoal, criar uma Twitch opensource, porquê não?


## Requisitos
O LivePub ele utiliza do NodeJS para sua API de funcionamento, portanto, é necessário que você tenha o NPM, NodeJS e as depedências do projeto (package.json) instalados em seu sistema. Além disso, usamos do Nginx e o Nginx rtmp-module para receber as transmissões RTMP e converte-las em HLS. Além disso, apenas garantimos o funcionamento pleno dele no Ubuntu 20.04 em diante.


# Funcionamento
Aqui, falaremos sobre como o LivePub funciona na prática.

## Explicação do HLS (Nginx)
O Nginx, ele deve estar configurado para receber as conexões RTMP, converter para o HLS e colocar em /var/www/html (pasta padrão do servidor web nginx). Com isso, ele ao receber a transmissão, ele automaticamente começa a sua conversão para o HLS (que é mais amigavel com navegadores). As configurações pré-definidas que funcionam com o LivePub estão disponíveis em: [clique aqui!](https://github.com/Hsyst/LivePub-200/tree/main/nginx-config-files)

## Explicação das APIs (NodeJS - Feito por nós)
Esse script, é responsável por administrar as lives que entram para a plataforma (apenas que é dono do canal consegue liberar a transmisão), como todos podem transmitir com o nome do canal, a api ela libera para a homepage apenas caso o nome-do-canal.m3u8 esteja disponivel no Servidor HTTP (HLS), e caso a chave do canal esteja correto, e portanto, transmitir no nome do outro canal se torna algo inutil 👍. Além disso, ele administra a criação e a remoção de lives, e de canais!

# Configuração do Nginx
A configuração do Nginx está disponível em: [clique aqui!](https://github.com/Hsyst/LivePub-200/tree/main/nginx-config-files). Mas atenção, você deve ter o Nginx e o **módulo RTMP** instalado.

# Configuração do LivePub
## Versão SSL e MAIN
### index.html
```
deve ser alterado nas versões MAIN e SSL
```
Primeiro, você deve alterar o [index.html](https://github.com/Hsyst/LivePub-200/blob/main/index.html) na linha 89 pelo endereço que você utiliza para acessar a `API do LivePub` que já deve estar em execução (*aprenda a executar e configurar em Tutorial de Uso*)

### create-a-channel.html
```
deve ser alterado nas versões MAIN e SSL
```
Segundo, você deve alterar o [create-a-channel.html](https://github.com/Hsyst/LivePub-200/blob/main/create-a-channel.html) na linha 107 e 127 pelo endereço que você utiliza para acessar a `API do LivePub` que já deve estar em execução (*aprenda a executar e configurar em Tutorial de Uso*)

### index-ssl.js
```
deve ser alterado apenas na versão SSL
```
Altere o [index-ssl.js](https://github.com/Hsyst/LivePub-200/blob/main/back/index-ssl.js) nas linhas 14 - Config de porta, 21/22 - Config de SSL, 143 (IP da `HLS (HTTP) Server`, aprenda a executar no *Tutorial de Uso*)

### index.js
```
deve ser alterado apenas na versão Comum (MAIN)
```
Altere o [index.js](https://github.com/Hsyst/LivePub-200/blob/main/back/index.js) nas linhas 12 - Config de porta, 140 (IP da `HLS (HTTP) Server`, aprenda a executar no *Tutorial de Uso*)



# Endpoints

## /add-channel
O add-channel, é um endpoint GET, que cria um canal e adiciona ao banco de dados. Um exemplo de uso seria: `/add-channel?name=open&desc=Meu top channel!` e a resposta seria: `message: 'Canal criado com sucesso', key`

## /release-live
Ele serve para verificar se a live já está com o arquivo .m3u8 disponivel no `Servidor HLS (HTTP) do nginx`, e ao estar disponivel ele adiciona a live ao Banco de Dados, o que faz ser liberado na página principal. Um exemplo de uso seria: `/release-live?channel=open&key=chave-do-canal-aqui`

## /rem-live
Ele remove a transmissão ao vivo do banco de dados, o que faz com que ele saia da página principal. Um exemplo de uso seria: `/rem-live?channel=open&key=chave-do-canal-aqui`
