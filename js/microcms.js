// microCMS API連携スクリプト（セキュアな実装）
// APIキーはCloudflareサーバー側で管理されているため、
// フロントエンドからはAPIエンドポイント経由でアクセス

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

// 実績データをHTMLに変換する関数
function createWorkCard(work) {
  const thumbnail = work.thumbnail?.url || 'https://via.placeholder.com/400x300?text=No+Image';
  const title = work.title || 'Untitled';
  const category = work.category || 'Other';
  const id = work.id;

  return `
    <div class="work-item" data-work-id="${id}" style="cursor: pointer;">
      <div class="work-bg" style="background-image: url('${thumbnail}'); background-size: cover; background-position: center;"></div>
      <div class="work-overlay">
        <span class="work-cat">${category}</span>
        <h3 class="work-title">${title}</h3>
      </div>
    </div>
  `;
}

// ポートフォリオセクションを更新する関数
async function updatePortfolioSection() {
  const works = await fetchWorksFromMicroCMS();
  
  if (works.length === 0) {
    console.log('No works found in microCMS');
    return;
  }

  const worksGrid = document.querySelector('.works-grid');
  if (!worksGrid) {
    console.error('Works grid element not found');
    return;
  }

  // 既存のコンテンツをクリア
  worksGrid.innerHTML = '';

  // 新しいカードを追加
  works.forEach(work => {
    const cardHTML = createWorkCard(work);
    worksGrid.insertAdjacentHTML('beforeend', cardHTML);
  });

  // クリックイベントを追加
  attachWorkCardListeners(works);
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
  const modal = document.createElement('div');
  modal.className = 'work-modal';
  modal.innerHTML = `
    <div class="work-modal-content">
      <button class="work-modal-close">&times;</button>
      <img src="${work.thumbnail?.url || 'https://via.placeholder.com/600x400'}" alt="${work.title}" class="work-modal-img">
      <div class="work-modal-info">
        <span class="work-modal-category">${work.category || 'Other'}</span>
        <h2 class="work-modal-title">${work.title}</h2>
        <p class="work-modal-date">${work.date || ''}</p>
        <div class="work-modal-content-text">${work.content || ''}</div>
        ${work.related_works && work.related_works.length > 0 ? `
          <div class="work-modal-related">
            <h3>RECOMMENDED WORKS</h3>
            <div class="related-works-grid">
              ${work.related_works.map(relatedWork => `
                <div class="related-work-card">
                  <img src="${relatedWork.thumbnail?.url || 'https://via.placeholder.com/300x200'}" alt="${relatedWork.title}">
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

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', updatePortfolioSection);
