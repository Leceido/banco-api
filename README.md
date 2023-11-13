# Banco API
Descrição: A API do Banco é uma parte fundamental do meu projeto de banco digital full stack [Banco App](https://github.com/Leceido/banco-app). Esta API é responsável por gerenciar transações financeiras, contas de usuário, autenticação e muito mais. Este README documenta as funcionalidades da API que se encontra hospedada no [Render](https://render.com/).

## Conteúdo
- Release
- Endpoints
- Exemplos de Uso

Essa API foi desenvolvida em NodeJS utilizando o mongoDB e as seguintes dependencias:
```
banco-api/package.json

"dependencies": {
    "bcrypt": "^5.1.1",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.1",
    "nodemon": "^3.0.1"
},
```

## Release

### Release: 1.1.0 (Release)
- Criação da rota para usuarios trocarem a senha
### Release: 1.0.0
- Lançamento do sistema

### Endpoints
A API oferece os seguintes endpoints:

- `GET /users/home`: Retorna as informações do usuario autenticado (nome, cpf, saldo)
- `GET /users/user/:cpf`: Retorna algumas informações de um usuário em especifico passando o cpf como parametro na URL (nome, cpf)
- `GET /users/contacts`: Retorna um array com todos os usuarios cadastrados (nome, cpf)
- `PATCH /users/deposit`: Realiza um deposito para o usuario autenticado
- `PATCH /users/withdraw`: Realiza um saque na conta do usuario autenticado
- `PATCH /users/transfer`: Usuario autenticado realiza uma transferencia para outro usuario
- `PATCH /users/pay`: Usuario autenticado realiza um pagamento para o BANCO
- `GET /users/statement`: Retorna o extrato bancario do usuario autenticado
- `PATCH /users/changepassword`: Realiza a troca da senha de um usuario
- `POST /users/signup`: Cadastrar usuario
- `POST /users/signin`: Autenticar usuario

### Exemplos de Uso
Aqui estão alguns exemplos de como utilizar os endpoints da API:

- Registro de Usuário
```
POST /users/signup

{
  "CPF": "12312312312",
  "name": "name123"
  "password": "senha123"
}

```
- Autenticação

```
POST /users/signin

{
  "cpf": "12312312312",
  "password": "senha123"
}
```
- Troca de senha

```
PATCH /users/changepassword

{
  "cpf": "12312312312",
  "password": "senha123"
}
```
- Transferência de Fundos

```
PATCH /users/transfer

{
  "beneficiary_cpf": 12312312312,
  "value": 100.00
}
```
- Depósito em Conta

```
PATCH /users/deposit

{
  "value": 500.00
}
````
- Saque de Conta

```
PATCH /users/withdraw

{
  "value": 50.00
}
```
- Pagamento

```
PATCH /users/pay

{
  "value": 50.00
}
```
