document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line', // Change here
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Monthly Revenue',
                data: [12000, 15000, 18000, 17000, 22000, 25000],
                borderColor: ' #F1B101', // Line color
                backgroundColor: '#F1B10133', // Fill under the line
                borderWidth: 3,
                fill: true,    // Fill the area under the line
                tension: 0.3   // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
    chartAreaBackgroundColor: {
        backgroundColor: '#ffffff' // <-- Change this to ANY color
    }
},
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
});

/*line graph with that can fetch data from database*/
/*document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    fetch('/api/revenue') // Call your API
        .then(response => response.json())
        .then(data => {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Monthly Revenue',
                        data: data.values,
                borderColor: ' #F1B101', // Line color
                backgroundColor: '#F1B10133', // Fill under the line
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: false }
                    }
                }
            });
        })
        .catch(err => console.error("Error fetching revenue:", err));
});
*/


const toggleSidebar = document.getElementById("toggleSidebar");
const sidebar = document.querySelector(".sidebar");

toggleSidebar.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

const addMemberBtn = document.getElementById('add-member-btn');
const dialog = document.getElementById('add-member-dialog');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('member-form');
const numberInput = document.getElementById('number');
const membersTableBody = document.querySelector('.members-table tbody');
const totalMembersEl = document.querySelector('.members-number p');

// Open dialog
addMemberBtn.addEventListener('click', () => {
  dialog.showModal();
});

// Close dialog on cancel
cancelBtn.addEventListener('click', () => {
  dialog.close();
});

// Prevent non-numeric input for contact number
numberInput.addEventListener('input', () => {
  numberInput.value = numberInput.value.replace(/[^0-9]/g, '');
});

// Handle form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = form.name.value;
  const number = form.number.value;
  const membership = form.membership.value;

  // Create new row
  const row = document.createElement('tr');

  // Get next member index
  const index = membersTableBody.children.length + 1;

  row.innerHTML = `
    <td>${index}</td>
    <td>${name}</td>
    <td>Active</td>
    <td>+${number}</td>
    <td>${capitalizeFirstLetter(membership)}</td>
    <td class="actions">
      <button class="edit">Edit</button>
      <button class="delete">Delete</button>
    </td>
  `;

  membersTableBody.appendChild(row);

  // Update total members
  totalMembersEl.textContent = membersTableBody.children.length;

  // Close dialog and reset form
  dialog.close();
  form.reset();
});

// Helper function to capitalize first letter
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


