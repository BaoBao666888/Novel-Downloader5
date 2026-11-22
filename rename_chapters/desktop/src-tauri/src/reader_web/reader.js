const key = location.hash.slice(1);
const books = document.querySelector('#books');
const toc = document.querySelector('#toc');
const tocPicker = document.querySelector('#toc-picker');
const article = document.querySelector('article');
const navigation = document.querySelector('nav');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const status = document.querySelector('#status');
const position = document.querySelector('#position');
const title = document.querySelector('#title');
const content = document.querySelector('#content');

let shelf = [];
let chapters = [];
let at = 0;
let pages = [];
let following = null;
let busy = false;

async function read(path) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function controls() {
  books.disabled = busy || !shelf.length;
  toc.disabled = busy;
  previous.disabled = busy || at === 0;
  next.disabled = busy || (chapters.length > 0 ? at + 1 >= chapters.length : !following);
}

async function run(task) {
  if (busy) return;
  busy = true;
  status.textContent = 'Đang tải…';
  controls();
  try {
    await task();
    status.textContent = shelf.length ? '' : 'Thư viện chưa có truyện.';
  } catch (error) {
    status.textContent = error.message || 'Không kết nối được với Novel Studio.';
  } finally {
    busy = false;
    controls();
  }
}

async function open(index, cursor = null) {
  const book = shelf.find(item => String(item.id) === books.value);
  if (!book) return;
  const base = `/api/books/${book.id}`;
  const isChapter = chapters.length > 0;
  const query = cursor ? '?' + new URLSearchParams({ offset: cursor.offset, stamp: cursor.stamp }) : '';
  const result = await read(isChapter ? `${base}/chapters/${index}` : base + '/page' + query);
  if (isChapter) {
    title.textContent = result.title;
    toc.value = String(index);
    position.textContent = `Chương ${index + 1} / ${chapters.length}`;
  } else {
    title.textContent = book.title;
    pages[index] = cursor;
    following = result.next;
    position.textContent = `Trang ${index + 1}`;
  }
  at = index;
  title.hidden = isChapter && result.text.trimStart().split('\n', 1)[0]?.trim() === result.title.trim();
  content.textContent = result.text + (result.truncated ? '\n\nChương quá dài. Mở trong Novel Studio để xem thêm khi có hỗ trợ.' : '');
  article.hidden = false;
  navigation.hidden = false;
  scrollTo(0, 0);
}

async function openBook() {
  article.hidden = true;
  navigation.hidden = true;
  tocPicker.hidden = true;
  at = 0;
  pages = [];
  following = null;
  chapters = [];
  const catalogue = await read(`/api/books/${books.value}/toc`);
  chapters = catalogue.chapters;
  if (!chapters.length && catalogue.kind === 'zip') throw new Error('Tệp ZIP không có chương TXT để đọc.');
  toc.replaceChildren(...chapters.map(item => new Option(item.title, item.index)));
  tocPicker.hidden = !chapters.length;
  await open(0);
}

books.addEventListener('change', () => void run(openBook));
toc.addEventListener('change', () => void run(() => open(Number(toc.value))));
previous.addEventListener('click', () => void run(() => open(at - 1, pages[at - 1])));
next.addEventListener('click', () => void run(() => open(at + 1, following)));

if (!/^[a-f0-9]{64}$/.test(key)) {
  status.textContent = 'Hãy mở liên kết được chia sẻ từ Novel Studio.';
} else {
  void run(async () => {
    shelf = await read('/api/books');
    books.replaceChildren(...shelf.map(book => new Option(book.title, book.id)));
    if (shelf.length) await openBook();
  });
}
