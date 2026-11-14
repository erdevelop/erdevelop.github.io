-- Cephe veritabanı örneği (SQLite). DB Browser for SQLite'ta "SQL Çalıştır" ile ya da:
--   sqlite3 cephe.db < cephe.sql
PRAGMA foreign_keys = ON;

CREATE TABLE projeler (
  id         INTEGER PRIMARY KEY,
  kod        TEXT NOT NULL UNIQUE,
  ad         TEXT NOT NULL,
  sehir      TEXT,
  baslangic  TEXT            -- YYYY-AA-GG
);

CREATE TABLE camlar (
  id         INTEGER PRIMARY KEY,
  proje_id   INTEGER NOT NULL REFERENCES projeler(id),
  poz        TEXT NOT NULL,
  en         INTEGER NOT NULL CHECK (en > 0),      -- mm
  boy        INTEGER NOT NULL CHECK (boy > 0),     -- mm
  kalinlik   INTEGER NOT NULL CHECK (kalinlik > 0),-- toplam cam kalınlığı, mm
  adet       INTEGER NOT NULL DEFAULT 1 CHECK (adet >= 1),
  durum      TEXT NOT NULL DEFAULT 'tasarım'       -- tasarım, sipariş, sahada, montaj
);

CREATE TABLE tedarikciler (
  id    INTEGER PRIMARY KEY,
  ad    TEXT NOT NULL UNIQUE,
  tur   TEXT                                         -- cam, profil, aksesuar
);

CREATE TABLE siparisler (
  id             INTEGER PRIMARY KEY,
  proje_id       INTEGER NOT NULL REFERENCES projeler(id),
  tedarikci_id   INTEGER NOT NULL REFERENCES tedarikciler(id),
  tarih          TEXT NOT NULL,
  tutar          REAL NOT NULL,                     -- €
  teslim         TEXT                               -- NULL: teslim edilmedi
);

CREATE TABLE hakedisler (
  id          INTEGER PRIMARY KEY,
  proje_id    INTEGER NOT NULL REFERENCES projeler(id),
  no          INTEGER NOT NULL,
  tarih       TEXT NOT NULL,
  kumulatif   REAL NOT NULL,                        -- o hakedişe kadar yapılan toplam iş, €
  UNIQUE (proje_id, no)
);

INSERT INTO projeler (id, kod, ad, sehir, baslangic) VALUES
  (1, 'P101', 'Ofis Kulesi',      'İstanbul', '2026-02-01'),
  (2, 'P102', 'Hastane Ek Bina',  'Ankara',   '2026-04-15'),
  (3, 'P103', 'Otel Cephesi',     'İzmir',    '2026-06-01');

INSERT INTO camlar (proje_id, poz, en, boy, kalinlik, adet, durum) VALUES
  (1, 'C-01', 1500, 2500, 14, 120, 'montaj'),
  (1, 'C-02', 1500,  900, 14,  60, 'sahada'),
  (1, 'C-03', 1200, 2500, 16,  24, 'sipariş'),
  (2, 'C-01', 1350, 2200, 12,  80, 'sipariş'),
  (2, 'C-02', 1350,  800, 12,  40, 'tasarım'),
  (2, 'C-04', 2700, 2200, 20,   6, 'tasarım'),
  (3, 'C-01', 1200, 3000, 16,  50, 'tasarım'),
  (3, 'C-02', 1200, 1000, 16,  50, 'tasarım');

INSERT INTO tedarikciler (id, ad, tur) VALUES
  (1, 'Anadolu Cam',    'cam'),
  (2, 'Ekstrüzyon AŞ',  'profil'),
  (3, 'Bağlantı Ltd',   'aksesuar');

INSERT INTO siparisler (proje_id, tedarikci_id, tarih, tutar, teslim) VALUES
  (1, 1, '2026-03-10', 42000, '2026-04-20'),
  (1, 2, '2026-03-05', 61000, '2026-04-02'),
  (1, 3, '2026-03-12',  9500, '2026-03-30'),
  (1, 1, '2026-05-02', 11800, NULL),
  (2, 2, '2026-05-20', 38500, '2026-06-25'),
  (2, 1, '2026-06-01', 27400, NULL),
  (3, 2, '2026-07-15', 29000, NULL);

INSERT INTO hakedisler (proje_id, no, tarih, kumulatif) VALUES
  (1, 1, '2026-04-30', 31000),
  (1, 2, '2026-05-31', 49600),
  (1, 3, '2026-06-30', 65100),
  (1, 4, '2026-07-31', 82300),
  (2, 1, '2026-06-30', 18200),
  (2, 2, '2026-07-31', 34900);
