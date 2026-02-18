'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { createClient } from '@/lib/supabase/client';

interface Equipment { [key: string]: string; }
interface Photos { [key: string]: string | null; }

interface FormData {
  companyName: string; reportDate: string; unitNumber: string; location: string;
  inspector: string;
  equipment: Equipment; comments: string;
  strapCount: string; lockCount: string; cornerCount: string; sideboardCount: string;
  roofBar: string; spareTire: string;
  roofCondition: string; roofDamageNote: string;
  sidesCondition: string; sidesDamageNote: string;
}

type Language = 'et' | 'ru';

const translations = {
  et: {
    appTitle: 'Haagise Kontrolli Süsteem',
    appSubtitle: 'Professionaalne PDF Aruande Generaator',
    myReports: 'Minu Aruanded',
    admin: 'Admin',
    submitReport: 'Esita Aruanne',
    saving: 'Salvestamine...',
    signOut: 'Logi Välja',
    successMessage: 'Aruanne salvestatud ja PDF alla laaditud!',
    unit: 'Üksus',
    date: 'Kuupäev',
    inspector: 'Kontrollija',
    noIssues: 'Probleeme Ei Ole',
    issuesFound: 'Probleemi Leitud',
    photosLabel: 'Fotod',
    tabs: {
      info: 'Põhiinfo',
      inventory: 'Inventuur',
      condition: 'Katus & Küljed',
      equipment: 'Varustus',
      photos: 'Fotod',
      comments: 'Kommentaarid'
    },
    basicInfo: {
      title: 'Põhiteave',
      companyName: 'Ettevõtte Nimi',
      unitNumber: 'Üksuse Number',
      unitPlaceholder: 'nt. FS6257',
      reportDate: 'Aruande Kuupäev',
      location: 'Asukoht',
      locationPlaceholder: 'Kontrolli asukoht',
      inspector: 'Kontrollija',
      inspectorHint: 'Kontrollija nimi määratakse teie kontolt'
    },
    inventory: {
      title: 'Inventuur',
      subtitle: 'Sisestage esemete arv ja kontrollige varustuse olemasolu:',
      straps: 'Rihmade Arv',
      locks: 'Lukkude Arv',
      corners: 'Nurkade Arv',
      sideboards: 'Külglaudade Arv',
      roofBar: 'Katuseriba',
      spareTire: 'Tagavararehv',
      yes: 'JAH',
      no: 'EI'
    },
    roofSides: {
      title: 'Katuse ja Külgede Seisukord',
      roof: 'Katuse Seisukord',
      sides: 'Külgede Seisukord',
      condition: 'Seisukord',
      ok: 'OK',
      damaged: 'Kahjustatud',
      describeDamage: 'Kirjeldage kahju',
      roofDamagePlaceholder: 'Mis on katusega valesti?',
      sidesDamagePlaceholder: 'Mis on külgedega valesti?'
    },
    equipment: {
      title: 'Varustuse Seisukord',
      subtitle: 'Valige iga varustuse seisukord:',
      tent: 'TENT',
      tirCord: 'TIR-TROSS',
      legs: 'JALAD/TOED',
      doors: 'UKSED',
      floor: 'PÕRAND',
      air: 'ÕHK',
      stanchions: 'STANGE',
      rearBumpers: 'ALLASÕIDUTÕKKED',
      lights: 'TULED',
      tires: 'REHVID',
      ok: 'OK',
      damaged: 'Kahjustatud'
    },
    photos: {
      title: 'Kontrollifotod',
      subtitle: 'Laadige üles fotod erinevatest nurkadest (klõpsake üleslaadimiseks, klõpsake ✕ eemaldamiseks):',
      frontLeft: 'EES VASAKUL',
      front: 'EES',
      left: 'VASAKUL',
      backRight: 'TAGA PAREMAL',
      back: 'TAGA',
      right: 'PAREMAL',
      clickToUpload: 'Klõpsake üleslaadimiseks'
    },
    comments: {
      title: 'Lisakommentaarid',
      placeholder: 'Sisestage haagise seisukorra kohta lisateavet või tähelepanekuid...'
    },
    install: 'Paigalda Rakendus'
  },
  ru: {
    appTitle: 'Система Проверки Прицепов',
    appSubtitle: 'Профессиональный Генератор PDF Отчетов',
    myReports: 'Мои Отчеты',
    admin: 'Админ',
    submitReport: 'Отправить Отчет',
    saving: 'Сохранение...',
    signOut: 'Выйти',
    successMessage: 'Отчет сохранен и PDF загружен!',
    unit: 'Юнит',
    date: 'Дата',
    inspector: 'Инспектор',
    noIssues: 'Проблем Нет',
    issuesFound: 'Проблем Найдено',
    photosLabel: 'Фотографии',
    tabs: {
      info: 'Основная Информация',
      inventory: 'Инвентарь',
      condition: 'Крыша и Борта',
      equipment: 'Оборудование',
      photos: 'Фотографии',
      comments: 'Комментарии'
    },
    basicInfo: {
      title: 'Основная Информация',
      companyName: 'Название Компании',
      unitNumber: 'Номер Юнита',
      unitPlaceholder: 'например, FS6257',
      reportDate: 'Дата Отчета',
      location: 'Местоположение',
      locationPlaceholder: 'Место проверки',
      inspector: 'Инспектор',
      inspectorHint: 'Имя инспектора установлено из вашего аккаунта'
    },
    inventory: {
      title: 'Инвентарь',
      subtitle: 'Введите количество предметов и проверьте наличие оборудования:',
      straps: 'Количество Ремней',
      locks: 'Количество Замков',
      corners: 'Количество Углов',
      sideboards: 'Количество Бортов',
      roofBar: 'Поперечина Крыши',
      spareTire: 'Запасное Колесо',
      yes: 'ДА',
      no: 'НЕТ'
    },
    roofSides: {
      title: 'Состояние Крыши и Бортов',
      roof: 'Состояние Крыши',
      sides: 'Состояние Бортов',
      condition: 'Состояние',
      ok: 'OK',
      damaged: 'Повреждено',
      describeDamage: 'Опишите повреждение',
      roofDamagePlaceholder: 'Что не так с крышей?',
      sidesDamagePlaceholder: 'Что не так с бортами?'
    },
    equipment: {
      title: 'Состояние Оборудования',
      subtitle: 'Выберите состояние каждого оборудования:',
      tent: 'ТЕНТ',
      tirCord: 'TIR-ТРОС',
      legs: 'НОГИ/ОПОРЫ',
      doors: 'ДВЕРИ',
      floor: 'ПОЛ',
      air: 'ВОЗДУХ',
      stanchions: 'СТОЙКИ',
      rearBumpers: 'ЗАДНИЙ БАМПЕР',
      lights: 'ФОНАРИ',
      tires: 'ШИНЫ',
      ok: 'OK',
      damaged: 'Повреждено'
    },
    photos: {
      title: 'Фотографии Осмотра',
      subtitle: 'Загрузите фотографии с разных ракурсов (нажмите для загрузки, нажмите ✕ для удаления):',
      frontLeft: 'ПЕРЕД СЛЕВА',
      front: 'ПЕРЕД',
      left: 'СЛЕВА',
      backRight: 'СЗАДИ СПРАВА',
      back: 'СЗАДИ',
      right: 'СПРАВА',
      clickToUpload: 'Нажмите для загрузки'
    },
    comments: {
      title: 'Дополнительные Комментарии',
      placeholder: 'Введите дополнительные замечания о состоянии прицепа...'
    },
    install: 'Установить Приложение'
  }
};

export default function Home() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('et');
  const [activeTab, setActiveTab] = useState<string>('info');
  const [photos, setPhotos] = useState<Photos>({
    frontLeft: null, front: null, left: null, backRight: null, back: null, right: null
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('driver');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const t = translations[lang];

  const [formData, setFormData] = useState<FormData>({
    companyName: 'Linford Transport OÜ',
    reportDate: new Date().toISOString().split('T')[0],
    unitNumber: '', location: '', inspector: '',
    equipment: {
      tent: 'OK', tirCord: 'OK', legs: 'OK', doors: 'OK', floor: 'OK',
      air: 'OK', stanchions: 'OK', rearBumpers: 'OK', lights: 'OK', tires: 'OK'
    },
    comments: '',
    strapCount: '', lockCount: '', cornerCount: '', sideboardCount: '',
    roofBar: 'YES', spareTire: 'YES',
    roofCondition: 'OK', roofDamageNote: '',
    sidesCondition: 'OK', sidesDamageNote: ''
  });

  // Load auth session and pre-populate inspector name
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.name) {
            setFormData(prev => ({ ...prev, inspector: data.name }));
          }
          if (data?.role) {
            setUserRole(data.role);
          }
        });
    });
  }, [router]);

  // PWA install prompt + iOS detection
  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstall(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const equipmentItems = [
    { key: 'tent', label: t.equipment.tent },
    { key: 'tirCord', label: t.equipment.tirCord },
    { key: 'legs', label: t.equipment.legs },
    { key: 'doors', label: t.equipment.doors },
    { key: 'floor', label: t.equipment.floor },
    { key: 'air', label: t.equipment.air },
    { key: 'stanchions', label: t.equipment.stanchions },
    { key: 'rearBumpers', label: t.equipment.rearBumpers },
    { key: 'lights', label: t.equipment.lights },
    { key: 'tires', label: t.equipment.tires }
  ];

  const statusOptions = [
    { value: 'OK', label: t.equipment.ok },
    { value: 'DAMAGED', label: t.equipment.damaged }
  ];

  const handlePhotoUpload = (position: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => ({ ...prev, [position]: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (position: string) => {
    setPhotos(prev => ({ ...prev, [position]: null }));
  };

  const updateEquipment = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, equipment: { ...prev.equipment, [key]: value } }));
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    const doc = new jsPDF('p', 'mm', 'a4') as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;
    const headerBlue: [number, number, number] = [56, 189, 248];
    const lightGray: [number, number, number] = [245, 245, 245];

    const addFooter = (pageNum: number) => {
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(8);
      doc.text(`Generated by ${formData.companyName}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    const addSection = (title: string, y: number): number => {
      doc.setFillColor(...headerBlue);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin + 3, y + 5.5);
      doc.setFont(undefined, 'normal');
      return y + 12;
    };

    // Header
    doc.setFillColor(...headerBlue);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(formData.companyName, pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Trailer Inspection Report', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Report Date: ${formatDate(formData.reportDate)}`, pageWidth / 2, 35, { align: 'center' });
    yPos = 55;

    // Trailer Information
    yPos = addSection('TRAILER INFORMATION', yPos);
    doc.setTextColor(0, 0, 0);
    doc.autoTable({
      startY: yPos, margin: { left: margin, right: margin },
      body: [
        [{ content: 'UNIT NUMBER', styles: { fillColor: lightGray, fontStyle: 'bold' } }, formData.unitNumber || '—',
         { content: 'LOCATION', styles: { fillColor: lightGray, fontStyle: 'bold' } }, formData.location || '—'],
        [{ content: 'INSPECTOR', styles: { fillColor: lightGray, fontStyle: 'bold' } }, formData.inspector || '—',
         { content: 'REPORT DATE', styles: { fillColor: lightGray, fontStyle: 'bold' } }, formatDate(formData.reportDate)]
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 45 }, 2: { cellWidth: 40 }, 3: { cellWidth: 45 } }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Inventory Section
    yPos = addSection('INVENTORY', yPos);
    doc.autoTable({
      startY: yPos, margin: { left: margin, right: margin },
      body: [
        [{ content: 'STRAPS', styles: { fillColor: lightGray, fontStyle: 'bold' } }, formData.strapCount || '—',
         { content: 'LOCKS', styles: { fillColor: lightGray, fontStyle: 'bold' } }, formData.lockCount || '—'],
        [{ content: 'CORNERS', styles: { fillColor: lightGray, fontStyle: 'bold' } }, formData.cornerCount || '—',
         { content: 'SIDEBOARDS', styles: { fillColor: lightGray, fontStyle: 'bold' } }, formData.sideboardCount || '—'],
        [{ content: 'ROOF BAR', styles: { fillColor: lightGray, fontStyle: 'bold' } },
         { content: formData.roofBar, styles: { textColor: formData.roofBar === 'NO' ? [220, 38, 38] : [22, 101, 52] } },
         { content: 'SPARE TIRE', styles: { fillColor: lightGray, fontStyle: 'bold' } },
         { content: formData.spareTire, styles: { textColor: formData.spareTire === 'NO' ? [220, 38, 38] : [22, 101, 52] } }]
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 40 }, 3: { cellWidth: 45 } }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Roof & Sides
    yPos = addSection('ROOF & SIDES CONDITION', yPos);
    doc.autoTable({
      startY: yPos, margin: { left: margin, right: margin },
      body: [
        [{ content: 'ROOF', styles: { fillColor: lightGray, fontStyle: 'bold' } },
         { content: formData.roofCondition, styles: { textColor: formData.roofCondition === 'DAMAGED' ? [220, 38, 38] : [22, 101, 52] } },
         { content: 'NOTES', styles: { fillColor: lightGray, fontStyle: 'bold' } },
         formData.roofCondition === 'DAMAGED' ? formData.roofDamageNote || '—' : 'N/A'],
        [{ content: 'SIDES', styles: { fillColor: lightGray, fontStyle: 'bold' } },
         { content: formData.sidesCondition, styles: { textColor: formData.sidesCondition === 'DAMAGED' ? [220, 38, 38] : [22, 101, 52] } },
         { content: 'NOTES', styles: { fillColor: lightGray, fontStyle: 'bold' } },
         formData.sidesCondition === 'DAMAGED' ? formData.sidesDamageNote || '—' : 'N/A']
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 25 }, 2: { cellWidth: 35 }, 3: { cellWidth: 70 } }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    // Equipment
    yPos = addSection('EQUIPMENT CONDITION', yPos);
    const equipmentData = equipmentItems.map(item => [
      item.label,
      { content: formData.equipment[item.key], styles: {
        textColor: formData.equipment[item.key] === 'OK' ? [22, 101, 52] : [220, 38, 38],
        fontStyle: formData.equipment[item.key] !== 'OK' ? 'bold' : 'normal'
      }}
    ]);
    doc.autoTable({
      startY: yPos, margin: { left: margin, right: margin },
      head: [[{ content: 'Equipment', styles: { fillColor: lightGray } }, { content: 'Status', styles: { fillColor: lightGray } }]],
      body: equipmentData,
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 65 } },
      alternateRowStyles: { fillColor: [252, 252, 252] }
    });
    yPos = doc.lastAutoTable.finalY + 10;

    if (formData.comments) {
      if (yPos > pageHeight - 60) { addFooter(1); doc.addPage(); yPos = margin; }
      yPos = addSection('ADDITIONAL COMMENTS', yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const splitComments = doc.splitTextToSize(formData.comments, pageWidth - 2 * margin - 10);
      doc.text(splitComments, margin + 5, yPos + 5);
    }
    addFooter(doc.internal.getNumberOfPages());

    // Photos
    const hasPhotos = Object.values(photos).some(p => p);
    if (hasPhotos) {
      doc.addPage();
      doc.setFillColor(...headerBlue);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('INSPECTION PHOTOS', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Unit: ${formData.unitNumber}`, pageWidth / 2, 27, { align: 'center' });
      yPos = 45;

      const photoPositions = [
        { key: 'frontLeft', label: 'FRONT LEFT' }, { key: 'front', label: 'FRONT' },
        { key: 'left', label: 'LEFT' }, { key: 'backRight', label: 'BACK RIGHT' },
        { key: 'back', label: 'BACK' }, { key: 'right', label: 'RIGHT' }
      ];
      const availablePhotos = photoPositions.filter(p => photos[p.key]);
      let col = 0, row = 0;
      for (const photo of availablePhotos) {
        const x = margin + col * 90;
        const y = yPos + row * 80;
        try {
          if (photos[photo.key]) {
            doc.addImage(photos[photo.key], 'JPEG', x, y, 80, 60);
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text(photo.label, x + 40, y + 68, { align: 'center' });
          }
        } catch (e) { console.error('Error adding image:', e); }
        col++;
        if (col >= 2) { col = 0; row++; }
      }
      addFooter(doc.internal.getNumberOfPages());
    }

    return doc.output('blob') as Blob;
  };

  const handleSubmit = async () => {
    if (!formData.unitNumber) {
      alert(lang === 'et' ? 'Palun sisestage üksuse number enne esitamist.' : 'Пожалуйста, введите номер юнита перед отправкой.');
      setActiveTab('info');
      return;
    }

    setIsSubmitting(true);
    setSaveSuccess(false);

    try {
      const pdfBlob = await generatePDFBlob();

      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `inspection-report-${formData.unitNumber}_${formData.reportDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      const fd = new FormData();
      fd.append('formData', JSON.stringify(formData));
      fd.append('pdf', pdfBlob, `inspection-report-${formData.unitNumber}_${formData.reportDate}.pdf`);

      const res = await fetch('/api/reports', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save report');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (error) {
      console.error('Submit error:', error);
      alert(lang === 'et'
        ? 'Aruanne alla laaditud, kuid serverisse salvestamine ebaõnnestus. Palun kontrollige ühendust.'
        : 'Отчет загружен, но не удалось сохранить на сервере. Пожалуйста, проверьте подключение.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'info', label: t.tabs.info, icon: '📋' },
    { id: 'inventory', label: t.tabs.inventory, icon: '📦' },
    { id: 'condition', label: t.tabs.condition, icon: '🏠' },
    { id: 'equipment', label: t.tabs.equipment, icon: '🔧' },
    { id: 'photos', label: t.tabs.photos, icon: '📷' },
    { id: 'comments', label: t.tabs.comments, icon: '💬' }
  ];

  const issueCount = Object.values(formData.equipment).filter(s => s !== 'OK').length +
    (formData.roofCondition === 'DAMAGED' ? 1 : 0) + (formData.sidesCondition === 'DAMAGED' ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50">
      <header className="bg-gradient-to-r from-sky-900 to-sky-700 text-white px-4 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚛</span>
            <div>
              <h1 className="text-xl font-bold">{t.appTitle}</h1>
              <p className="text-sm opacity-80">{t.appSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              <button
                onClick={() => setLang('et')}
                className={`px-3 py-1.5 rounded ${lang === 'et' ? 'bg-white text-sky-900 font-bold' : 'bg-sky-800 hover:bg-sky-900'}`}
              >
                ET
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-3 py-1.5 rounded ${lang === 'ru' ? 'bg-white text-sky-900 font-bold' : 'bg-sky-800 hover:bg-sky-900'}`}
              >
                RU
              </button>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium text-sm transition-colors"
            >
              📱 {t.install}
            </button>
            <a href="/reports"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-medium text-sm transition-colors">
              📁 {t.myReports}
            </a>
            {userRole === 'admin' && (
              <a href="/admin"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-medium text-sm transition-colors">
                ⚙️ {t.admin}
              </a>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-wait transition-all">
              {isSubmitting
                ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.saving}</>)
                : (<>📄 {t.submitReport}</>)}
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-sky-800 hover:bg-sky-900 rounded-lg font-medium text-sm transition-colors">
              {t.signOut}
            </button>
          </div>
        </div>
      </header>

      {saveSuccess && (
        <div className="bg-emerald-500 text-white text-center py-3 font-semibold">
          ✅ {t.successMessage}
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIOSInstall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowIOSInstall(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {lang === 'et' ? 'Paigalda Rakendus' : 'Установить Приложение'}
            </h3>
            <div className="space-y-4 text-lg">
              <p className="font-semibold text-gray-700">
                {lang === 'et' ? 'iPhone/iPad juhised:' : 'Инструкции для iPhone/iPad:'}
              </p>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>
                  {lang === 'et'
                    ? 'Vajutage Jaga nuppu (⬆️) ekraani allosas'
                    : 'Нажмите кнопку Поделиться (⬆️) внизу экрана'}
                </li>
                <li>
                  {lang === 'et'
                    ? 'Kerige alla ja valige "Lisa avaekraanile"'
                    : 'Прокрутите вниз и выберите "На экран Домой"'}
                </li>
                <li>
                  {lang === 'et'
                    ? 'Vajutage "Lisa" üleval paremal'
                    : 'Нажмите "Добавить" в правом верхнем углу'}
                </li>
              </ol>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowIOSInstall(false)}
                  className="flex-1 py-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-semibold text-lg transition-colors"
                >
                  {lang === 'et' ? 'Sain aru' : 'Понятно'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex gap-6 text-sm flex-wrap">
          <div><strong>{t.unit}:</strong> {formData.unitNumber || '—'}</div>
          <div><strong>{t.date}:</strong> {formatDate(formData.reportDate)}</div>
          <div><strong>{t.inspector}:</strong> {formData.inspector || '—'}</div>
          <div className={issueCount > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
            {issueCount > 0 ? `⚠️ ${issueCount} ${t.issuesFound}` : `✅ ${t.noIssues}`}
          </div>
          <div><strong>{t.photosLabel}:</strong> {Object.values(photos).filter(p => p).length}/6</div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <nav className="flex border-b bg-gray-50 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-4 font-medium flex items-center gap-2 whitespace-nowrap transition-all border-b-2
                  ${activeTab === tab.id ? 'bg-white text-sky-700 border-sky-500' : 'text-gray-500 hover:text-gray-700 border-transparent'}`}>
                <span>{tab.icon}</span><span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">{t.basicInfo.title}</h2>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.basicInfo.companyName}</label>
                  <input type="text" value={formData.companyName} onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.basicInfo.unitNumber} *</label>
                    <input type="text" placeholder={t.basicInfo.unitPlaceholder} value={formData.unitNumber} onChange={(e) => setFormData(prev => ({ ...prev, unitNumber: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.basicInfo.reportDate}</label>
                    <input type="date" value={formData.reportDate} onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.basicInfo.location}</label>
                    <input type="text" placeholder={t.basicInfo.locationPlaceholder} value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.basicInfo.inspector}</label>
                    <input
                      type="text"
                      value={formData.inspector}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      title={t.basicInfo.inspectorHint}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">{t.inventory.title}</h2>
                <p className="text-gray-500">{t.inventory.subtitle}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.inventory.straps}</label>
                    <input type="number" min="0" placeholder="0" value={formData.strapCount} onChange={(e) => setFormData(prev => ({ ...prev, strapCount: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.inventory.locks}</label>
                    <input type="number" min="0" placeholder="0" value={formData.lockCount} onChange={(e) => setFormData(prev => ({ ...prev, lockCount: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.inventory.corners}</label>
                    <input type="number" min="0" placeholder="0" value={formData.cornerCount} onChange={(e) => setFormData(prev => ({ ...prev, cornerCount: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.inventory.sideboards}</label>
                    <input type="number" min="0" placeholder="0" value={formData.sideboardCount} onChange={(e) => setFormData(prev => ({ ...prev, sideboardCount: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.inventory.roofBar}</label>
                    <select value={formData.roofBar} onChange={(e) => setFormData(prev => ({ ...prev, roofBar: e.target.value }))}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium ${formData.roofBar === 'YES' ? 'border-green-300 text-green-600' : 'border-red-300 text-red-600'}`}>
                      <option value="YES">{t.inventory.yes}</option><option value="NO">{t.inventory.no}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.inventory.spareTire}</label>
                    <select value={formData.spareTire} onChange={(e) => setFormData(prev => ({ ...prev, spareTire: e.target.value }))}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium ${formData.spareTire === 'YES' ? 'border-green-300 text-green-600' : 'border-red-300 text-red-600'}`}>
                      <option value="YES">{t.inventory.yes}</option><option value="NO">{t.inventory.no}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'condition' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">{t.roofSides.title}</h2>
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-700">{t.roofSides.roof}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.roofSides.condition}</label>
                      <select value={formData.roofCondition} onChange={(e) => setFormData(prev => ({ ...prev, roofCondition: e.target.value }))}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium ${formData.roofCondition === 'OK' ? 'border-green-300 text-green-600' : 'border-red-300 text-red-600'}`}>
                        <option value="OK">{t.roofSides.ok}</option><option value="DAMAGED">{t.roofSides.damaged}</option>
                      </select>
                    </div>
                    {formData.roofCondition === 'DAMAGED' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.roofSides.describeDamage}</label>
                        <input type="text" placeholder={t.roofSides.roofDamagePlaceholder} value={formData.roofDamageNote} onChange={(e) => setFormData(prev => ({ ...prev, roofDamageNote: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none bg-red-50" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-700">{t.roofSides.sides}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.roofSides.condition}</label>
                      <select value={formData.sidesCondition} onChange={(e) => setFormData(prev => ({ ...prev, sidesCondition: e.target.value }))}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none bg-white font-medium ${formData.sidesCondition === 'OK' ? 'border-green-300 text-green-600' : 'border-red-300 text-red-600'}`}>
                        <option value="OK">{t.roofSides.ok}</option><option value="DAMAGED">{t.roofSides.damaged}</option>
                      </select>
                    </div>
                    {formData.sidesCondition === 'DAMAGED' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.roofSides.describeDamage}</label>
                        <input type="text" placeholder={t.roofSides.sidesDamagePlaceholder} value={formData.sidesDamageNote} onChange={(e) => setFormData(prev => ({ ...prev, sidesDamageNote: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none bg-red-50" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">{t.equipment.title}</h2>
                <p className="text-gray-500">{t.equipment.subtitle}</p>
                <div className="space-y-2">
                  {equipmentItems.map(item => (
                    <div key={item.key} className={`flex justify-between items-center p-4 rounded-lg ${formData.equipment[item.key] !== 'OK' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                      <span className="font-medium">{item.label}</span>
                      <select value={formData.equipment[item.key]} onChange={(e) => updateEquipment(item.key, e.target.value)}
                        className={`px-4 py-2 border-2 rounded-lg bg-white font-medium ${formData.equipment[item.key] === 'OK' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}>
                        {statusOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">{t.photos.title}</h2>
                <p className="text-gray-500">{t.photos.subtitle}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'frontLeft', label: t.photos.frontLeft }, { key: 'front', label: t.photos.front },
                    { key: 'left', label: t.photos.left }, { key: 'backRight', label: t.photos.backRight },
                    { key: 'back', label: t.photos.back }, { key: 'right', label: t.photos.right }
                  ].map(pos => (
                    <div key={pos.key} className="relative">
                      <label className={`aspect-[4/3] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-sky-400 block
                        ${photos[pos.key] ? 'border-sky-500 border-solid' : 'border-gray-300 bg-gray-50'}`}>
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(pos.key, e)} className="hidden" />
                        {photos[pos.key] ? (
                          <div className="relative w-full h-full">
                            <img src={photos[pos.key] as string} alt={pos.label} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-semibold py-2 text-center">{pos.label}</div>
                          </div>
                        ) : (
                          <><span className="text-3xl mb-2">📷</span><span className="text-sm font-semibold text-gray-600">{pos.label}</span><span className="text-xs text-gray-400">{t.photos.clickToUpload}</span></>
                        )}
                      </label>
                      {photos[pos.key] && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removePhoto(pos.key); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10" title="Remove">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">{t.comments.title}</h2>
                <textarea placeholder={t.comments.placeholder} value={formData.comments} onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none resize-y" />
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">Trailer Inspection Report Generator • Powered by Linford</footer>
    </div>
  );
}
