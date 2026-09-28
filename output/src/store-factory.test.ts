import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { criarStore } from "./store-factory.js";

describe("criarStore", () => {
  it("usa arquivos locais por padrão e com classpath", () => {
    assert.doesNotThrow(() => criarStore({}));
    assert.doesNotThrow(() => criarStore({ ELENCOS_SOURCE: "classpath" }));
  });

  it("exige bucket ao selecionar S3", () => {
    assert.throws(
      () => criarStore({ ELENCOS_SOURCE: "s3" }),
      /S3_BUCKET é obrigatório quando ELENCOS_SOURCE=s3/,
    );
    assert.doesNotThrow(() => criarStore({ ELENCOS_SOURCE: "s3", S3_BUCKET: "janela-galo" }));
  });

  it("rejeita valores de fonte desconhecidos", () => {
    assert.throws(
      () => criarStore({ ELENCOS_SOURCE: "api" }),
      /ELENCOS_SOURCE inválido/,
    );
  });
});
