# Tutorial de Uso - LivePub
Olá usuário, tudo bem? Aqui você vai aprender a como instalar, e configurar seu LivePub!

## Requisitos
Para esse tutorial fluir, você necessita do NPM e NodeJS instalados (`sudo apt install nodejs npm` - para realizar a instalação). Além disso, o LivePub foi desenvolvido para o Ubuntu 20.04 em diante, e portanto, não damos nenhum tipo de suporte ou tutorial para outra distro ou sistema operacional.

## Instalação

### 1:
Primeiro, realize o `git clone` desse repositório
```
git clone https://github.com/Hsyst/LivePub-200
```

### 2:
Agora, acesse a pasta com os arquivos
```
cd LivePub-200/back
```

### 3:
Agora, você deve realizar as alterações nos arquivos que são pedidos na [documentação técnica](https://github.com/Hsyst/LivePub-200/tree/main#configura%C3%A7%C3%A3o-do-livepub), relaxa é só alterar as linhas.

### 4:
Agora, você deve instalar o nginx e o módulo RTMP e configura-lo.
```
sudo apt update && apt install nginx libnginx-mod-rtmp -y && rm -rf /etc/nginx/nginx.conf /etc/nginx/sites-enabled/* && cp ../nginx-config-files/nginx.conf /etc/nginx && cp ../nginx-config-files/default /etc/nginx/sites-enabled/ && service nginx restart
```

### 5:
Instale as dependencias da API
```
npm install
```

### 6:
Passe o HTML para o servidor da API
```
mkdir html && cp -r ../*.html html/ && cp -r ../assets html/
```

### 7:
Caso seja localhost, apenas rodar o servidor e pronto!
```
npm run main
```

### ATENÇÃO
Caso seja fora de sua máquina, leia a documentação técnica e realize as alterações necessárias.
