import { useMemo, useState } from "react";

type MenuItem = [string, number];

type MenuSectionData = {
  title: string;
  emoji: string;
  background: string;
  border: string;
  items: MenuItem[];
};

const initialSections: MenuSectionData[] = [
  {
    title: "Лимонады",
    emoji: "🍋",
    background: "#fff4c7",
    border: "#f4c542",
    items: [
      ["Клубничный", 85],
      ["Апельсиновый", 85],
      ["Кокосовый", 85],
      ["Банановый", 85],
      ["Банан с мятой", 90],
      ["Апельсин с мятой", 90],
      ["Клубника с мятой", 95],
    ],
  },
  {
    title: "Кофе",
    emoji: "☕",
    background: "#f3e1cf",
    border: "#c08457",
    items: [
      ["Кофе с шоколадом", 85],
      ["Кофе с солёной карамелью", 85],
      ["Кофе с молоком и шоколадом", 100],
      ["Кофе с солёной карамелью и молоком", 100],
      ["Кофе с молоком", 90],
    ],
  },
  {
    title: "Чай и напитки",
    emoji: "🫖",
    background: "#dcfce7",
    border: "#86c99a",
    items: [
      ["Чай мятный", 85],
      ["Чай с молоком", 90],
      ["Какао", 95],
      ["Квас", 75],
    ],
  },
  {
    title: "Милкшейки",
    emoji: "🥤",
    background: "#fce7f3",
    border: "#e9a3c9",
    items: [
      ["Шоколадный", 95],
      ["Солёная карамель", 95],
    ],
  },
  {
    title: "Закуски",
    emoji: "🍪",
    background: "#ffe4e6",
    border: "#f0a2a9",
    items: [
      ["Конфеты, 1 шт.", 5],
      ["Кислые червячки, 1 шт.", 5],
      ["Печенье с шоколадной крошкой, 1 шт.", 20],
    ],
  },
];

function escapeHtml(text: string) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function encodeMenuData(data: unknown) {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeMenuData(encoded: string) {
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function getInitialMenuState() {
  const hash = window.location.hash.replace(/^#/, "");
  const decoded = hash ? decodeMenuData(hash) : null;

  if (
    decoded &&
    typeof decoded.title === "string" &&
    typeof decoded.subtitle === "string" &&
    Array.isArray(decoded.sections)
  ) {
    return {
      title: decoded.title,
      subtitle: decoded.subtitle,
      sections: decoded.sections as MenuSectionData[],
    };
  }

  return {
    title: "Кафе Купавна-Лайф",
    subtitle: "Напитки и закуски",
    sections: initialSections,
  };
}

function MenuSection({
  section,
  sectionIndex,
  updateTitle,
  updateItem,
  addItem,
  removeItem,
  isViewMode,
}: {
  section: MenuSectionData;
  sectionIndex: number;
  updateTitle: (sectionIndex: number, value: string) => void;
  updateItem: (sectionIndex: number, itemIndex: number, fieldIndex: number, value: string) => void;
  addItem: (sectionIndex: number) => void;
  removeItem: (sectionIndex: number, itemIndex: number) => void;
  isViewMode: boolean;
}) {
  return (
    <div className="menu-section" style={{ background: section.background, borderColor: section.border }}>
      <div className="section-title-row">
        <span className="section-emoji">{section.emoji}</span>
        {isViewMode ? (
          <div className="section-title-static">{section.title}</div>
        ) : (
          <input
            className="section-title-input"
            value={section.title}
            onChange={(e) => updateTitle(sectionIndex, e.target.value)}
          />
        )}
      </div>

      <div className="items-list">
        {section.items.map((item, itemIndex) => (
          <div className="item-row" key={`${sectionIndex}-${itemIndex}`}>
            {isViewMode ? (
              <>
                <div className="item-name-static">{item[0]}</div>
                <div className="item-price-static">{item[1]} ₽</div>
              </>
            ) : (
              <>
                <input
                  className="item-name-input"
                  value={item[0]}
                  onChange={(e) => updateItem(sectionIndex, itemIndex, 0, e.target.value)}
                />
                <input
                  className="item-price-input"
                  type="number"
                  value={item[1]}
                  onChange={(e) => updateItem(sectionIndex, itemIndex, 1, e.target.value)}
                />
                <button className="small-button danger no-print" onClick={() => removeItem(sectionIndex, itemIndex)}>
                  ×
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {!isViewMode && (
        <button className="secondary-button no-print" onClick={() => addItem(sectionIndex)}>
          + Добавить позицию
        </button>
      )}
    </div>
  );
}

export default function App() {
  const initialState = getInitialMenuState();
  const isViewMode = new URLSearchParams(window.location.search).get("view") === "1";
  const [title, setTitle] = useState(initialState.title);
  const [subtitle, setSubtitle] = useState(initialState.subtitle);
  const [sections, setSections] = useState<MenuSectionData[]>(initialState.sections);
  const [copyStatus, setCopyStatus] = useState("");

  const totalItems = useMemo(
    () => sections.reduce((sum, section) => sum + section.items.length, 0),
    [sections]
  );

  const updateTitle = (sectionIndex: number, value: string) => {
    setSections((prev) => prev.map((section, i) => (i === sectionIndex ? { ...section, title: value } : section)));
  };

  const updateItem = (sectionIndex: number, itemIndex: number, fieldIndex: number, value: string) => {
    setSections((prev) =>
      prev.map((section, i) => {
        if (i !== sectionIndex) return section;
        return {
          ...section,
          items: section.items.map((item, j) => {
            if (j !== itemIndex) return item;
            if (fieldIndex === 0) {
              return [value, item[1]];
            }
            return [item[0], Number(value) || 0];
          }),
        };
      })
    );
  };

  const addItem = (sectionIndex: number) => {
    setSections((prev) =>
      prev.map((section, i) =>
        i === sectionIndex ? { ...section, items: [...section.items, ["Новая позиция", 0]] } : section
      )
    );
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    setSections((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? { ...section, items: section.items.filter((_, j) => j !== itemIndex) }
          : section
      )
    );
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        title: "Новый раздел",
        emoji: "✨",
        background: "#e0f2fe",
        border: "#7dd3fc",
        items: [["Новая позиция", 0]],
      },
    ]);
  };

  const copyViewLink = async () => {
    const data = encodeMenuData({ title, subtitle, sections });
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const viewUrl = `${baseUrl}?view=1#${data}`;

    try {
      await navigator.clipboard.writeText(viewUrl);
      setCopyStatus("Ссылка на готовое меню скопирована");
    } catch {
      window.prompt("Скопируйте ссылку на готовое меню:", viewUrl);
      setCopyStatus("Ссылка готова");
    }
  };

  const openEditVersion = () => {
    const data = encodeMenuData({ title, subtitle, sections });
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    window.location.href = `${baseUrl}#${data}`;
  };

  const openPrintVersion = () => {
    const sectionHtml = sections
      .map(
        (section) => `
          <section class="print-section" style="background:${section.background};border-color:${section.border}">
            <h2><span>${escapeHtml(section.emoji)}</span>${escapeHtml(section.title)}</h2>
            ${section.items
              .map(
                (item) => `
                  <div class="print-row">
                    <span>${escapeHtml(item[0])}</span>
                    <strong>${Number(item[1]) || 0} ₽</strong>
                  </div>
                `
              )
              .join("")}
          </section>
        `
      )
      .join("");

    const html = `
      <!doctype html>
      <html lang="ru">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #3b2f2f; background: #fff7ed; }
            .page { max-width: 900px; margin: 0 auto; background: white; border-radius: 28px; padding: 32px; box-shadow: 0 12px 40px rgba(0,0,0,.08); }
            h1 { margin: 0; font-size: 46px; line-height: 1.05; text-align: center; }
            .subtitle { margin: 10px 0 28px; text-align: center; font-size: 18px; color: #78716c; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
            .print-section { break-inside: avoid; border: 2px solid; border-radius: 22px; padding: 18px; }
            h2 { margin: 0 0 14px; font-size: 25px; display: flex; gap: 10px; align-items: center; }
            .print-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 8px 0; border-bottom: 1px dashed #bda98f; font-size: 17px; }
            .print-row:last-child { border-bottom: 0; }
            strong { white-space: nowrap; }
            .footer { margin-top: 24px; text-align: center; color: #78716c; font-size: 15px; }
            .print-button { position: fixed; right: 20px; top: 20px; border: 0; border-radius: 999px; padding: 12px 18px; background: #f97316; color: white; font-weight: 700; cursor: pointer; box-shadow: 0 8px 24px rgba(249,115,22,.3); }
            @media print { body { background: white; padding: 0; } .page { box-shadow: none; border-radius: 0; } .print-button { display: none; } }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">Печать / сохранить PDF</button>
          <main class="page">
            <h1>${escapeHtml(title)}</h1>
            <div class="subtitle">${escapeHtml(subtitle)}</div>
            <div class="grid">${sectionHtml}</div>
            <div class="footer">Сделано с любовью ☀️ Хорошего дня и вкусных напитков!</div>
          </main>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Браузер заблокировал новое окно. Разрешите всплывающие окна для этой страницы.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .app {
          min-height: 100vh;
          padding: 24px;
          font-family: Arial, sans-serif;
          color: #3b2f2f;
          background:
            radial-gradient(circle at top left, #fff7ad 0, transparent 26%),
            radial-gradient(circle at bottom right, #ffd1dc 0, transparent 28%),
            #fff7ed;
        }
        .container { max-width: 1100px; margin: 0 auto; }
        .header {
          margin-bottom: 20px;
          padding: 24px;
          border-radius: 28px;
          background: rgba(255,255,255,.86);
          box-shadow: 0 12px 32px rgba(120, 72, 20, .12);
        }
        .label {
          margin-bottom: 10px;
          color: #f97316;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .title-input, .subtitle-input, .section-title-input, .item-name-input, .item-price-input {
          width: 100%;
          border: 0;
          outline: none;
          border-radius: 14px;
          background: rgba(255,255,255,.7);
          color: #3b2f2f;
        }
        .title-input, .title-static { padding: 10px 14px; font-size: 42px; font-weight: 900; margin: 0; }
        .subtitle-input, .subtitle-static { margin-top: 8px; padding: 10px 14px; font-size: 18px; }
        .title-static, .subtitle-static { border-radius: 14px; background: rgba(255,255,255,.35); }
        .header-row { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; }
        .meta { margin-top: 10px; color: #78716c; font-size: 14px; }
        .buttons { display: flex; gap: 10px; flex-wrap: wrap; }
        button {
          border: 0;
          border-radius: 999px;
          padding: 12px 16px;
          font-weight: 800;
          cursor: pointer;
        }
        .primary-button { background: #f97316; color: white; box-shadow: 0 8px 20px rgba(249,115,22,.25); }
        .outline-button { background: white; color: #9a3412; border: 2px solid #fed7aa; }
        .secondary-button { margin-top: 14px; background: rgba(255,255,255,.78); color: #7c2d12; }
        .small-button { width: 34px; height: 34px; padding: 0; font-size: 22px; line-height: 1; }
        .danger { background: rgba(255,255,255,.62); color: #be123c; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .menu-section {
          border: 3px solid;
          border-radius: 28px;
          padding: 18px;
          box-shadow: 0 10px 26px rgba(120, 72, 20, .12);
        }
        .section-title-row { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; margin-bottom: 14px; }
        .section-emoji { font-size: 34px; }
        .section-title-input, .section-title-static { padding: 10px 12px; font-size: 24px; font-weight: 900; }
        .section-title-static { border-radius: 14px; background: rgba(255,255,255,.35); }
        .items-list { display: grid; gap: 8px; }
        .item-row { display: grid; grid-template-columns: 1fr 82px 34px; gap: 8px; align-items: center; }
        .item-name-input, .item-price-input, .item-name-static, .item-price-static { padding: 9px 10px; font-size: 16px; }
        .item-name-static, .item-price-static { border-radius: 14px; background: rgba(255,255,255,.35); }
        .item-price-input, .item-price-static { text-align: right; font-weight: 800; }
        .footer {
          margin-top: 20px;
          padding: 16px;
          border-radius: 24px;
          background: rgba(255,255,255,.72);
          text-align: center;
          color: #78716c;
          box-shadow: 0 8px 20px rgba(120, 72, 20, .08);
        }
        @media (max-width: 760px) {
          .app { padding: 12px; }
          .header-row { grid-template-columns: 1fr; }
          .title-input, .title-static { font-size: 30px; }
          .grid { grid-template-columns: 1fr; }
        }
        @media print {
          .no-print, button { display: none !important; }
          .app { background: white; padding: 0; }
          .header, .menu-section, .footer { box-shadow: none; }
          input { background: transparent !important; padding-left: 0 !important; padding-right: 0 !important; }
          .item-row { grid-template-columns: 1fr 72px; }
        }
      `}</style>

      <main className="container">
        <section className="header">
          <div className="header-row">
            <div>
              <div className="label no-print">{isViewMode ? "✨ Готовое меню" : "✨ Конструктор меню"}</div>
              {isViewMode ? (
                <>
                  <h1 className="title-static">{title}</h1>
                  <div className="subtitle-static">{subtitle}</div>
                </>
              ) : (
                <>
                  <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <input className="subtitle-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                  <div className="meta no-print">Всего позиций: {totalItems}</div>
                  {copyStatus && <div className="meta no-print">{copyStatus}</div>}
                </>
              )}
            </div>
            <div className="buttons no-print">
              {isViewMode ? (
                <button className="outline-button" onClick={openEditVersion}>Редактировать меню</button>
              ) : (
                <>
                  <button className="primary-button" onClick={copyViewLink}>Скопировать ссылку на меню</button>
                  <button className="outline-button" onClick={addSection}>+ Раздел</button>
                  <button className="outline-button" onClick={openPrintVersion}>Открыть PDF-версию</button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="grid">
          {sections.map((section, index) => (
            <MenuSection
              key={index}
              section={section}
              sectionIndex={index}
              updateTitle={updateTitle}
              updateItem={updateItem}
              addItem={addItem}
              removeItem={removeItem}
              isViewMode={isViewMode}
            />
          ))}
        </section>

        <div className="footer">Сделано с любовью ☀️ Хорошего дня и вкусных напитков!</div>
      </main>
    </div>
  );
}
