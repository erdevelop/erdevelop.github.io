Cephe Metraj (web)
Masaüstü programın (cephe_app.py) kendisi tarayıcıda Pyodide ile çalışır (Pyodide jsdelivr CDN'den yüklenir, internet gerekir);
arayüz webtk.py + tkweb.js ile HTML'e çevrilir.
Yayın: bu klasörü olduğu gibi sunun (GitHub Pages). Yerelde test: python -m http.server -> http://localhost:8000
Masaüstü sürümü güncellenince cephe_app.py dosyasını değiştirmeniz yeter.
Kütüphane: sol paneldeki 'Kütüphane klasörü seç...' ile bilgisayardaki kütüphane klasörü seçilir (ör. C:\_ERDAL\_KUTUPHANE\BLOCK_DWG
ya da içindeki E50). Chrome / Edge klasörü okur; programın kütüphaneye yazdıkları (şablon, _yedek, referans.json, cephe_sistem.json)
klasöre geri yazılır. Klasör hatırlanır; tarayıcı izni düşerse 'Yeniden bağla'. Firefox / Safari: salt okunur, yazılanlar indirilir.
Program dosyaları her açılışta sunucuya sorularak yüklenir (önbellekte eski sürüm kalmaz). tkweb.js değişirse index.html'deki
'tkweb.js?v=...' değerini değiştirin.
Şablon kur › Resim: katalog kesitinin ekran görüntüsü Ctrl+V ile yapıştırılır (ya da 'Aç...'); 'Resimden tanı' numpy ister,
ilk kullanımda Pyodide'den bir kez yüklenir (~10 MB).
