DROP TABLE IF EXISTS siparisler, malzemeler, projeler;

CREATE TABLE projeler (
  id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kod   text NOT NULL UNIQUE,
  ad    text NOT NULL,
  sehir text NOT NULL
);

CREATE TABLE malzemeler (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kod         text NOT NULL UNIQUE,
  ad          text NOT NULL,
  birim       text NOT NULL DEFAULT 'adet',
  birim_fiyat numeric(10,2) NOT NULL CHECK (birim_fiyat >= 0),
  stok        integer NOT NULL DEFAULT 0 CHECK (stok >= 0)
);

CREATE TABLE siparisler (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proje_id   integer NOT NULL REFERENCES projeler(id) ON DELETE CASCADE,
  malzeme_id integer NOT NULL REFERENCES malzemeler(id) ON DELETE RESTRICT,
  adet       integer NOT NULL CHECK (adet > 0),
  durum      text NOT NULL DEFAULT 'yeni'
             CHECK (durum IN ('yeni', 'üretim', 'teslim', 'iptal')),
  olusturma  timestamptz NOT NULL DEFAULT now()
);
