import React, { useState } from 'react';
import { Shield, AlertTriangle, FileText, ArrowLeft, Mail, Scale, Check, Copy } from 'lucide-react';
import { ViewType } from '../types';

interface LegalPagesProps {
  initialTab: 'disclaimer' | 'dmca' | 'privacy';
  onBackToHome: () => void;
}

export default function LegalPages({ initialTab, onBackToHome }: LegalPagesProps) {
  const [activeTab, setActiveTab] = useState<'disclaimer' | 'dmca' | 'privacy'>(initialTab);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('dmca@animeto.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'disclaimer', label: 'Disclaimer', icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { id: 'dmca', label: 'DMCA Policy', icon: Scale, color: 'text-neko-500 bg-neko-500/10 border-neko-500/20' },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield, color: 'text-neko-purple bg-neko-purple/10 border-neko-purple/20' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 px-4 py-2 rounded-full transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </button>
        <span className="text-[10px] font-mono text-zinc-500 select-none">TERAKHIR DIPERBARUI: JULI 2026</span>
      </div>

      {/* Header Area */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neko-purple/10 border border-neko-purple/20 text-neko-purple rounded-full text-[10px] font-black uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" /> Informasi Hukum & Kebijakan
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight">
          Syarat, Ketentuan & Kebijakan <span className="text-neko-purple">Animeto</span>
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
          Kami berkomitmen untuk menyediakan platform streaming anime yang transparan, aman, dan mematuhi hukum yang berlaku. Silakan baca kebijakan kami secara teliti.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-col sm:flex-row gap-2.5 p-1.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                isActive 
                  ? 'bg-zinc-900 border border-zinc-800 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent'
              }`}
            >
              <div className={`p-1 rounded-md border ${tab.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Policy Content Area */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-zinc-300">
        
        {activeTab === 'disclaimer' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-lg text-white">Disclaimer (Penyangkalan)</h2>
                <p className="text-xs text-zinc-500">Batasan Tanggung Jawab Konten Platform Animeto</p>
              </div>
            </div>

            <div className="space-y-4">
              <p>
                Platform <b>Animeto</b> hanya bertindak sebagai direktori indeks pencarian dan pemutar media untuk tautan video streaming anime yang tersedia di internet secara publik. Seluruh konten media, gambar, video, dan subtitle yang tersaji disediakan oleh server pihak ketiga eksternal yang tidak memiliki afiliasi langsung dengan pengembang Animeto.
              </p>
              
              <div className="border border-amber-500/10 bg-amber-500/[0.02] p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-amber-500 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4" /> PENTING UNTUK DIKETAHUI:
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400">
                  <li>Kami tidak menyimpan (host), memodifikasi, mengunggah, atau mentransmisikan berkas video atau media apa pun di server internal kami sendiri.</li>
                  <li>Animeto tidak bertanggung jawab atas legalitas, kualitas, kebenaran terjemahan, kepemilikan hak cipta, atau keamanan konten video pihak ketiga tersebut.</li>
                  <li>Penggunaan platform streaming ini sepenuhnya merupakan risiko dan tanggung jawab masing-masing pengguna akhir.</li>
                </ul>
              </div>

              <p>
                Tautan keluar atau media player dari luar mungkin mengarahkan Anda ke situs pihak ketiga yang di luar kendali kami. Kami sangat menyarankan pengguna untuk mengaktifkan perlindungan keamanan browser dan memaklumi jika terdapat iklan sponsor dari pemutar video pihak ketiga terkait.
              </p>

              <p>
                Jika Anda menemukan konten yang merugikan atau melanggar undang-undang yang berlaku di daerah Anda, silakan hubungi penyedia host berkas video asli terlebih dahulu untuk penghapusan permanen dari internet, atau hubungi kami untuk menghapus tautan indeks dari direktori Animeto melalui tab <b>DMCA Policy</b>.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'dmca' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2 rounded-xl bg-neko-500/10 border border-neko-500/20 text-neko-500">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-lg text-white">DMCA & Copyright Policy</h2>
                <p className="text-xs text-zinc-500">Prosedur Pengaduan Hak Cipta & Penghapusan Konten</p>
              </div>
            </div>

            <div className="space-y-4">
              <p>
                <b>Animeto</b> sangat menghargai dan menjunjung tinggi hak kekayaan intelektual milik para kreator, studio animasi, dan pemegang hak cipta resmi. Kami mematuhi ketentuan <i>Digital Millennium Copyright Act</i> (DMCA) dan regulasi hak cipta internasional.
              </p>

              <p>
                Jika Anda adalah pemilik hak cipta sah atau agen resmi yang ditunjuk, dan Anda menemukan tautan indeks di platform Animeto yang mengarah ke konten berhak cipta Anda tanpa izin resmi, Anda dapat mengajukan permintaan penghapusan (takedown request) dengan menyertakan bukti tertulis yang valid.
              </p>

              <div className="bg-zinc-950/60 border border-zinc-800 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide">Persyaratan Dokumen Klaim DMCA:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-xs text-zinc-400">
                  <li>Tanda tangan fisik atau elektronik dari pemilik hak cipta asli atau kuasanya yang sah.</li>
                  <li>Identifikasi spesifik mengenai karya berhak cipta yang diklaim telah dilanggar (misalnya, judul anime, episode, dan tautan URL asli pemilik).</li>
                  <li>Alamat URL halaman spesifik di platform Animeto yang memuat indeks video pelanggaran tersebut.</li>
                  <li>Informasi kontak pengirim klaim yang lengkap (Nama, Alamat, Nomor Telepon, dan Alamat Email aktif).</li>
                  <li>Pernyataan beriktikad baik (good faith statement) bahwa penggunaan materi yang diadukan tidak diizinkan oleh pemilik atau hukum.</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-neko-500/[0.03] border border-neko-500/10 rounded-2xl gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide block">Alamat Email Pengaduan Resmi:</span>
                  <div className="flex items-center gap-2 text-neko-500 font-mono font-bold text-sm">
                    <Mail className="w-4 h-4 text-neko-500" /> dmca@animeto.com
                  </div>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-800 transition active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" /> Salin Email
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-zinc-500 italic">
                Pemberitahuan: Kami akan menindaklanjuti dan memproses semua laporan penghapusan indeks dalam kurun waktu 2 x 24 jam kerja setelah dokumen keluhan divalidasi.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2 rounded-xl bg-neko-purple/10 border border-neko-purple/20 text-neko-purple">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-lg text-white">Privacy Policy (Kebijakan Privasi)</h2>
                <p className="text-xs text-zinc-500">Komitmen Kami Terhadap Perlindungan Data & Privasi Anda</p>
              </div>
            </div>

            <div className="space-y-4">
              <p>
                Kebijakan Privasi ini menjelaskan bagaimana <b>Animeto</b> mengumpulkan, mengelola, menggunakan, dan melindungi informasi pribadi yang Anda berikan saat berinteraksi dengan layanan platform kami.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl space-y-2">
                  <h4 className="font-bold text-white text-xs">1. Pengumpulan Informasi</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Kami mengumpulkan data nama pengguna, alamat email terdaftar, riwayat daftar tontonan (watchlist) lokal, serta avatar pilihan Anda ketika melakukan pendaftaran akun demi personalisasi pengalaman streaming.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl space-y-2">
                  <h4 className="font-bold text-white text-xs">2. Berbagi Data</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Animeto tidak akan pernah memperjualbelikan, menyewakan, atau mendistribusikan data pribadi Anda kepada pihak ketiga eksternal untuk tujuan pemasaran apa pun tanpa persetujuan eksplisit.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl space-y-2">
                  <h4 className="font-bold text-white text-xs">3. Cookie & Penyimpanan</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Kami memanfaatkan cookie browser, LocalStorage, dan SessionStorage untuk melacak status sesi login aktif Anda dan mengingat daftar watchlist yang telah Anda pilih agar tidak terhapus saat berpindah halaman.
                  </p>
                </div>
                <div className="p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl space-y-2">
                  <h4 className="font-bold text-white text-xs">4. Keamanan Akun</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Kata sandi akun Anda disimpan secara terenkripsi menggunakan protokol keamanan standar industri Firebase Authentication untuk memastikan akun Anda terlindungi dari upaya akses ilegal.
                  </p>
                </div>
              </div>

              <p>
                Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu seiring penambahan fitur-fitur baru di platform kami. Setiap perubahan akan diumumkan langsung di halaman kebijakan hukum ini.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Trust Badge / Footer Info */}
      <div className="text-center py-4 text-xs text-zinc-500 border border-zinc-800/50 rounded-2xl bg-zinc-950/30 flex items-center justify-center gap-2 select-none">
        <Shield className="w-4 h-4 text-neko-purple" />
        <span>Animeto Streaming Platform &bull; Dipercaya Oleh Ribuan Penggemar Anime</span>
      </div>

    </div>
  );
}
