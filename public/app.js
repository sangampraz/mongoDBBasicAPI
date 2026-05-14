const tableBody = document.querySelector('#products-body');
const form = document.querySelector('#product-form');
const message = document.querySelector('#message');

function ShowMessage(text) {
  message.textContent = text;
}

function AddTeamRow(team) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><a href="/api/teams/${team._id}">${team.name}</a></td>
    <td>$${team.gamesPlayed}</td>
    <td>${team.gamesWon}</td>
    <td>${team.gamesLoss}</td>
    <td>${team.location}</td>
  `;
  tableBody.appendChild(row);
}

async function LoadProducts() {
  tableBody.innerHTML = '';
  const response = await fetch('/api/teams');
  const teams = await response.json();
  teams.forEach(AddTeamRow);
  ShowMessage(`Loaded ${teams.length} team(s).`);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const team = {
    name: formData.get('name'),
    gamesPlayed: Number(formData.get('gamesPlayed')),
    gamesWon: Number(formData.get('gamesWon')),
    gamesLoss: Number(formData.get('gamesLoss')),
    location: formData.get('location')
  };

  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(team)
  });

  if (!response.ok) {
    const error = await response.json();
    ShowMessage(error.error || 'Could not add product.');
    return;
  }

  form.reset();
  await LoadProducts();
});

LoadProducts().catch(error => ShowMessage(error.message));
