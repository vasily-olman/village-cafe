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
];

function encodeMenuData(data: unknown) {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);

  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeMenuData(encoded: string) {
  try {
    const normalized = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

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
    return decoded;
  }

  return {
    title: "Летний магазинчик",
    subtitle: "Домашние напитки и вкусняшки",
    sections: initialSections,
  };
}

export default function App() {
  const initialState = getInitialMenuState();

  const isViewMode =
    new URLSearchParams(window.location.search).get("view") === "1";

  const [title, setTitle] = useState(initialState.title);
  const [subtitle, setSubtitle] = useState(initialState.subtitle);
  const [sections, setSections] = useState<MenuSectionData[]>(
    initialState.sections
  );

  const [copyStatus, setCopyStatus] = useState("");

  const totalItems = useMemo(
    () => sections.reduce((sum, section) => sum + section.items.length, 0),
    [sections]
  );

  const updateTitle = (sectionIndex: number, value: string) => {
    setSections((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? { ...section, title: value }
          : section
      )
    );
  };

  const updateItem = (
    sectionIndex: number,
    itemIndex: number,
    fieldIndex: number,
    value: string
  ) => {
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
        i === sectionIndex
          ? {
              ...section,
              items: [...section.items, ["Новая позиция", 0]],
            }
          : section
      )
    );
  };

  const removeItem = (
    sectionIndex: number,
    itemIndex: number
  ) => {
    setSections((prev) =>
      prev.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              items: section.items.filter(
                (_, j) => j !== itemIndex
              ),
            }
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
    const data = encodeMenuData({
      title,
      subtitle,
      sections,
    });

    const baseUrl =
      `${window.location.origin}${window.location.pathname}`;

    const viewUrl =
      `${baseUrl}?view=1#${data}`;

    try {
      await navigator.clipboard.writeText(viewUrl);

      setCopyStatus(
        "Ссылка на готовое меню скопирована"
      );
    } catch {
      window.prompt(
        "Скопируйте ссылку на готовое меню:",
        viewUrl
      );
    }
  };

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .app {
          min-height: 100vh;
          padding: 24px;
          font-family: Arial, sans-serif;
          background: #fff7ed;
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 20px;
          padding: 24px;
          border-radius: 28px;
          background: white;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
        }

        .buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        button {
          border: 0;
          border-radius: 999px;
          padding: 12px 16px;
          font-weight: bold;
          cursor: pointer;
        }

        .primary-button {
          background: #f97316;
          color: white;
        }

        .outline-button {
          background: white;
          border: 2px solid #fed7aa;
          color: #9a3412;
        }

        .title-input {
          width: 100%;
          font-size: 42px;
          font-weight: 900;
          border: 0;
          outline: none;
          margin-bottom: 10px;
        }

        .subtitle-input {
          width: 100%;
          font-size: 18px;
          border: 0;
          outline: none;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .menu-section {
          border: 3px solid;
          border-radius: 28px;
          padding: 18px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-title input {
          width: 100%;
          font-size: 24px;
          font-weight: bold;
          border: 0;
          outline: none;
          background: rgba(255,255,255,.5);
          padding: 10px;
          border-radius: 14px;
        }

        .item-row {
          display: grid;
          grid-template-columns: 1fr 90px 36px;
          gap: 8px;
          margin-bottom: 8px;
        }

        .item-row input {
          border: 0;
          outline: none;
          padding: 10px;
          border-radius: 12px;
          background: rgba(255,255,255,.6);
        }

        .price {
          text-align: right;
          font-weight: bold;
        }

        .remove {
          background: rgba(255,255,255,.6);
          color: crimson;
        }

        .footer {
          margin-top: 20px;
          text-align: center;
          color: #666;
        }

        @media (max-width: 760px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .header-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <main className="container">
        <section className="header">
          <div className="header-row">
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "#f97316",
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                ✨ {isViewMode ? "МЕНЮ" : "КОНСТРУКТОР МЕНЮ"}
              </div>

              <input
                className="title-input"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                disabled={isViewMode}
              />

              <input
                className="subtitle-input"
                value={subtitle}
                onChange={(e) =>
                  setSubtitle(e.target.value)
                }
                disabled={isViewMode}
              />

              <div
                style={{
                  marginTop: 10,
                  color: "#777",
                }}
              >
                Всего позиций: {totalItems}
              </div>

              {copyStatus && (
                <div
                  style={{
                    marginTop: 10,
                    color: "green",
                  }}
                >
                  {copyStatus}
                </div>
              )}
            </div>

            <div className="buttons">
              {!isViewMode && (
                <>
                  <button
                    className="primary-button"
                    onClick={copyViewLink}
                  >
                    Скопировать ссылку
                  </button>

                  <button
                    className="outline-button"
                    onClick={addSection}
                  >
                    + Раздел
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="grid">
          {sections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="menu-section"
              style={{
                background: section.background,
                borderColor: section.border,
              }}
            >
              <div className="section-title">
                <span style={{ fontSize: 34 }}>
                  {section.emoji}
                </span>

                <input
                  value={section.title}
                  onChange={(e) =>
                    updateTitle(
                      sectionIndex,
                      e.target.value
                    )
                  }
                  disabled={isViewMode}
                />
              </div>

              {section.items.map((item, itemIndex) => (
                <div
                  className="item-row"
                  key={itemIndex}
                >
                  <input
                    value={item[0]}
                    onChange={(e) =>
                      updateItem(
                        sectionIndex,
                        itemIndex,
                        0,
                        e.target.value
                      )
                    }
                    disabled={isViewMode}
                  />

                  <input
                    className="price"
                    type="number"
                    value={item[1]}
                    onChange={(e) =>
                      updateItem(
                        sectionIndex,
                        itemIndex,
                        1,
                        e.target.value
                      )
                    }
                    disabled={isViewMode}
                  />

                  {!isViewMode && (
                    <button
                      className="remove"
                      onClick={() =>
                        removeItem(
                          sectionIndex,
                          itemIndex
                        )
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {!isViewMode && (
                <button
                  className="outline-button"
                  style={{ marginTop: 12 }}
                  onClick={() =>
                    addItem(sectionIndex)
                  }
                >
                  + Добавить позицию
                </button>
              )}
            </div>
          ))}
        </section>

        <div className="footer">
          Сделано с любовью ☀️
        </div>
      </main>
    </div>
  );
}