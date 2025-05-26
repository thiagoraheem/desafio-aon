CREATE DATABASE techcorp;

CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       nome VARCHAR(100),
                       email VARCHAR(100) UNIQUE,
                       idade INT
);
