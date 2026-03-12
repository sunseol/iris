const targetEl = document.getElementById('target');
const priceEl = document.getElementById('price');
const crEl = document.getElementById('cr');
const salesEl = document.getElementById('sales');
const visitorsEl = document.getElementById('visitors');

function format(n) {
  return Number(n).toLocaleString('en-US');
}

function calculate() {
  const target = Math.max(100, Number(targetEl.value) || 3000);
  const price = Math.max(1, Number(priceEl.value) || 49);
  const cr = Math.max(0.001, (Number(crEl.value) || 2) / 100);

  const neededSales = Math.ceil(target / price);
  const neededVisitors = Math.ceil(neededSales / cr);

  salesEl.textContent = `${format(neededSales)}건`;
  visitorsEl.textContent = `${format(neededVisitors)}명`;
}

[targetEl, priceEl, crEl].forEach((el) => {
  el.addEventListener('input', calculate);
});

calculate();
