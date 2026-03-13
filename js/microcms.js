// microCMS API連携スクリプト（セキュアな実装）
// APIキーはCloudflareサーバー側で管理されているため、
// フロントエンドからはAPIエンドポイント経由でアクセス

let allWorks = []; // すべての実績データを保持
let allCategories = []; // すべてのカテゴリーデータを保持

// Cloudflare Pages Functionsのエンドポイントからデータを取得
async function fetchWorksFromMicroCMS() {
  try {
    const response = await fetch('/api/works');

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.contents || [];
  } catch (error) {
    console.error('Failed to fetch works:', error);
    return [];
  }
}

// カテゴリーデータを取得
async function fetchCategoriesFromMicroCMS() {
  try {
    const response = await fetch('/api/categories');

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.contents || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

// 実績データをHTMLに変換する関数
function createWorkCard(work) {
  // thumbnail または eyecatch プロパティから画像URLを取得
  const thumbnail = work.thumbnail?.url || work.eyecatch?.url || 'https://via.placeholder.com/600x400?text=No+Image';
  const title = work.title || 'Untitled';
  
  // カテゴリーがオブジェクトの場合、nameを取得
  let categoryName = 'Other';
  if (work.categories && work.categories.name) {
    categoryName = work.categories.name;
  } else if (work.category && work.category.name) {
    categoryName = work.category.name;
  }
  
  const id = work.id;

  // index.htmlとworks.htmlで構造を分ける
  const isWorksPage = window.location.pathname.includes('works.html');

  if (isWorksPage) {
    // works.html用：index.htmlのSelected Worksと同じ構造（背景画像 + オーバーレイ）
    return `
      <div class="work-item" data-work-id="${id}" data-category="${categoryName}">
        <div class="work-bg" style="background-image: url('${thumbnail}');"></div>
        <div class="work-overlay">
          <span class="work-cat">${categoryName}</span>
          <h3 class="work-title">${title}</h3>
        </div>
      </div>
    `;
  } else {
    // index.html用：既存の構造を維持
    return `
      <div class="work-item" data-work-id="${id}" data-category="${categoryName}" style="cursor: pointer;">
        <div class="work-bg" style="background-image: url('${thumbnail}'); background-size: cover; background-position: center;"></div>
        <div class="work-overlay">
          <span class="work-cat">${categoryName}</span>
          <h3 class="work-title">${title}</h3>
        </div>
      </div>
    `;
  }
}

// ポートフォリオセクションを更新する関数
async function updatePortfolioSection() {
  allWorks = await fetchWorksFromMicroCMS();
  allCategories = await fetchCategoriesFromMicroCMS();
  
  if (allWorks.length === 0) {
    console.log('No works found in microCMS');
    return;
  }

  // 初回表示：すべての実績を表示
  displayWorks(allWorks);
  
  // フィルターボタンを動的に生成
  generateFilterButtons();

  // カーソルエフェクトの再設定（新規要素に対して）
  if (typeof setupCursorEffects === 'function') {
    setupCursorEffects();
  }
}

// 実績を表示する関数
function displayWorks(worksToDisplay) {
  const worksGrid = document.querySelector('.works-grid');
  if (!worksGrid) {
    console.error('Works grid element not found');
    return;
  }

  // 既存のコンテンツをクリア
  worksGrid.innerHTML = '';

  // 新しいカードを追加
  worksToDisplay.forEach(work => {
    const cardHTML = createWorkCard(work);
    worksGrid.insertAdjacentHTML('beforeend', cardHTML);
  });

  // クリックイベントを追加
  attachWorkCardListeners(allWorks);

  // カーソルエフェクトの再設定
  if (typeof setupCursorEffects === 'function') {
    setupCursorEffects();
  }
}

// フィルターボタンを動的に生成
function generateFilterButtons() {
  const filterContainer = document.querySelector('.works-filter');
  if (!filterContainer) {
    console.error('Filter container not found');
    return;
  }

  // 既存のボタンをクリア
  filterContainer.innerHTML = '';

  // ALLボタンを追加
  const isWorksPage = window.location.pathname.includes('works.html');
  const allButton = document.createElement('button');
  allButton.className = 'filter-btn active';
  allButton.dataset.filter = 'ALL';
  allButton.textContent = isWorksPage ? 'すべて' : 'ALL';
  filterContainer.appendChild(allButton);

  // カテゴリーボタンを追加
  allCategories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'filter-btn';
    button.dataset.filter = category.name;
    button.textContent = category.name;
    filterContainer.appendChild(button);
  });

  // フィルターボタンのイベント設定
  setupFilterButtons();
}

// フィルターボタンのイベント設定
function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // すべてのボタンからactiveクラスを削除
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // クリックされたボタンにactiveクラスを追加
      this.classList.add('active');
      
      // フィルター値を取得
      const filterValue = this.dataset.filter;
      
      // フィルタリング処理
      if (filterValue === 'ALL') {
        displayWorks(allWorks);
      } else {
        const filteredWorks = allWorks.filter(work => {
          if (work.categories && work.categories.name) {
            return work.categories.name === filterValue;
          } else if (work.category && work.category.name) {
            return work.category.name === filterValue;
          }
          return false;
        });
        displayWorks(filteredWorks);
      }
    });
  });
}

// 実績カードのクリックイベントを設定
function attachWorkCardListeners(works) {
  const cards = document.querySelectorAll('.work-item[data-work-id]');
  cards.forEach(card => {
    card.addEventListener('click', function() {
      const workId = this.dataset.workId;
      const work = works.find(w => w.id === workId);
      if (work) {
        showWorkDetail(work);
      }
    });
  });
}

// 実績の詳細を表示する関数（モーダルで表示）
function showWorkDetail(work) {
  // カテゴリー名を取得
  let categoryName = 'Other';
  if (work.categories && work.categories.name) {
    categoryName = work.categories.name;
  } else if (work.category && work.category.name) {
    categoryName = work.category.name;
  }

  const thumbnail = work.thumbnail?.url || work.eyecatch?.url || 'https://via.placeholder.com/600x400';

  const modal = document.createElement('div');
  modal.className = 'work-modal';
  modal.innerHTML = `
    <div class="work-modal-content">
      <button class="work-modal-close">&times;</button>
      <img src="${thumbnail}" alt="${work.title}" class="work-modal-img">
      <div class="work-modal-info">
        <span class="work-modal-category">${categoryName}</span>
        <h2 class="work-modal-title">${work.title}</h2>
        <p class="work-modal-date">${work.date || ''}</p>
        <div class="work-modal-content-text">${work.content || ''}</div>
        ${work.related_works && work.related_works.length > 0 ? `
          <div class="work-modal-related">
            <h3>RECOMMENDED WORKS</h3>
            <div class="related-works-grid">
              ${work.related_works.map(relatedWork => `
                <div class="related-work-card">
                  <img src="${relatedWork.thumbnail?.url || relatedWork.eyecatch?.url || 'https://via.placeholder.com/300x200'}" alt="${relatedWork.title}">
                  <p>${relatedWork.title}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // クローズボタンのイベント
  modal.querySelector('.work-modal-close').addEventListener('click', () => {
    modal.remove();
  });

  // モーダル外をクリックしてクローズ
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// メガメニューのカテゴリーを読み込む関数
async function setupMegaMenu() {
  const megaList = document.getElementById('megaCategoryList');
  if (!megaList) return;

  const categories = await fetchCategoriesFromMicroCMS();
  
  // 「すべて見る」を残してクリア
  megaList.innerHTML = '<li><a href="./works.html">すべて見る</a></li>';
  
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="./works.html?category=${encodeURIComponent(cat.name)}">${cat.name}</a>`;
    megaList.appendChild(li);
  });

  // 新しく追加されたリンクにもカーソルエフェクトを適用
  if (typeof setupCursorEffects === 'function') {
    setupCursorEffects();
  }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
  updatePortfolioSection();
  setupMegaMenu();
});
