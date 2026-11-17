INSERT INTO projeler (kod, ad, sehir) VALUES
  ('P-101', 'Kule A',          'İstanbul'),
  ('P-102', 'Ofis Bloğu',      'Ankara'),
  ('P-103', 'Havalimanı Terminal', 'İzmir'),
  ('P-104', 'Hastane Ek Bina', 'Bursa');

INSERT INTO malzemeler (kod, ad, birim, birim_fiyat, stok) VALUES
  ('CAM-01', 'Isıcam 6+16+6',   'm2',     1450.00, 200),
  ('SLK-01', 'Yapısal silikon', 'kartuş',  310.00, 500),
  ('ANK-01', 'Ankraj braketi',  'adet',    185.50, 150),
  ('PRF-01', 'Alüminyum dikme', 'm',       420.00, 800),
  ('CNT-01', 'EPDM conta',      'm',        28.75, 3000);

INSERT INTO siparisler (proje_id, malzeme_id, adet, durum) VALUES
  (1, 1, 120, 'üretim'),
  (1, 2,  60, 'teslim'),
  (1, 3,  96, 'yeni'),
  (2, 1,  40, 'yeni'),
  (2, 4, 310, 'üretim'),
  (3, 5, 900, 'teslim'),
  (3, 3,  24, 'iptal'),
  (3, 1,  75, 'teslim');
