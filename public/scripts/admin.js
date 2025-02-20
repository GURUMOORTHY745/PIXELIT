const API_URL = 'https://pixelit.onrender.com/api';
const token = localStorage.getItem('token');

// Redirect to login if token is missing
if (!token) {
    window.location.href = 'index.html';
}

// Fetch and update a specific table
async function fetchAndUpdateTable(endpoint, tableId) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data for endpoint: ${endpoint}`);
        }

        const items = await response.json();
        updateTable(tableId, items, endpoint);
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
    }
}

// Update a table with fetched data
function updateTable(tableId, items, endpoint) {
    const tableElement = document.getElementById(tableId);
    if (!tableElement) {
        console.error(`Table with ID '${tableId}' not found.`);
        return;
    }

    const tableBody = tableElement.querySelector('tbody');
    tableBody.innerHTML = items.map((item, index) => {
        const { _id, photo, ...fields } = item;

        // Debug: Log the image URL before displaying
        console.log(`📸 Image URL for ${endpoint}:`, photo);

        const validPhotoUrl = photo.startsWith('http') ? photo : 'https://via.placeholder.com/100';
  // ✅ Fix broken paths

        const fieldCells = Object.entries(fields)
            .map(([key, value]) => `<td>${value || "-"}</td>`)
            .join('');

        const photoCell = photo
            ? `<td><img src="${validPhotoUrl}" width="50" height="50" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/50';"></td>`
            : '<td>No Image</td>';

        return `
            <tr>
                <td>${index + 1}</td>
                ${fieldCells}
                ${photoCell}
                <td>
                    <button onclick="editItem('${endpoint}', '${_id}', '${JSON.stringify(fields).replace(/"/g, "&quot;")}')">Edit</button>
                    <button onclick="deleteItem('${endpoint}', '${_id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}
// Function to handle adding data for any model
async function addItem(endpoint, formId, tableId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        try {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to add item');

            alert('✅ Added successfully!');
            form.reset();
            fetchAndUpdateTable(endpoint, tableId);
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
            console.error(`Error adding to ${endpoint}:`, error);
        }
    });

    fetchAndUpdateTable(endpoint, tableId);
}

// Edit an item
async function editItem(endpoint, id, itemData) {
    const data = JSON.parse(itemData.replace(/&quot;/g, '"'));

    const formHtml = `
        <form id="edit-form">
            ${Object.entries(data).map(([key, value]) => `
                <label>${key}:</label>
                <input type="text" name="${key}" value="${value}" required><br>
            `).join('')}
            <label>Photo:</label>
            <input type="file" name="photo"><br>
            <button type="submit">Update</button>
        </form>
    `;

    const div = document.createElement("div");
    div.innerHTML = formHtml;
    document.body.appendChild(div);

    // Handle form submission
    document.getElementById("edit-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const fileInput = formData.get("photo");

        if (!fileInput.name) {
            formData.delete("photo"); // If no new image is selected, remove it
        }

        try {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update item');
            }

            alert("✅ Updated successfully!");
            fetchAndUpdateTable(endpoint, `${endpoint}-table`); // Refresh table
            div.remove(); // Remove form after submission
        } catch (error) {
            console.error(`Error updating item in ${endpoint}:`, error);
        }
    });
}

// Delete an item
async function deleteItem(endpoint, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to delete item');
        }

        alert("🗑️ Deleted successfully!");
        fetchAndUpdateTable(endpoint, `${endpoint}-table`); // Refresh table
    } catch (error) {
        console.error(`Error deleting item from ${endpoint}:`, error);
    }
}

// Apply form handlers for all models
addItem('members', 'add-members-form', 'members-table');
addItem('coordinators', 'add-coordinators-form', 'coordinators-table');
addItem('upcomingEvents', 'add-events-form', 'upcomingEvents-table');
addItem('clubGames', 'add-games-form', 'clubGames-table');
addItem('contacts', 'add-contacts-form', 'contacts-table');

// Logout functionality
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});
