// admin.js (replace your current file with this)
let allSupplies = []; // full list for searching

async function loadSupplyList() {
  try {
    const res = await fetch("supplies.php?action=list");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allSupplies = await res.json();
    renderSupplyList(allSupplies);
  } catch (err) {
    console.error("loadSupplyList error:", err);
    document.getElementById("supplyList").innerHTML =
      `<tr><td colspan="4" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
  }
}

function renderSupplyList(supplies) {
  const tbody = document.getElementById("supplyList");
  tbody.innerHTML = "";

  if (!supplies || supplies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#666;">No supplies found.</td></tr>`;
    return;
  }

  supplies.forEach(supply => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${supply.supply_id}</td>
      <td>${escapeHtml(supply.item_name)}</td>
      <td>${supply.quantity}</td>
      <td>
        <button class="editBtn" 
                data-id="${supply.supply_id}" 
                data-name="${escapeHtml(supply.item_name)}" 
                data-qty="${supply.quantity}">
          Edit
        </button>
        <button class="deleteBtn" data-id="${supply.supply_id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// simple HTML escape
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"'`=\/]/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'
  })[s]);
}

// Use event delegation so Edit/Delete still work after rerenders
document.getElementById("supplyList").addEventListener("click", async (e) => {
  const el = e.target;
  // Delete
  if (el.classList.contains("deleteBtn")) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch("supplies.php?action=delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supply_id: el.dataset.id })
      });
      const txt = await res.text();
      console.log("delete response text:", txt);
      let json;
      try { json = JSON.parse(txt); } catch (err) { throw new Error("Server returned invalid JSON: " + txt); }
      if (!json.success) throw new Error(json.error || "Delete failed");
      loadSupplyList();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  // Edit
  if (el.classList.contains("editBtn")) {
    const curName = el.dataset.name;
    const curQty = el.dataset.qty;
    const newName = prompt("Enter new item name:", curName);
    if (newName === null) return;
    const newQty = prompt("Enter new quantity:", curQty);
    if (newQty === null) return;

    if (!newName.trim() || !newQty.trim()) {
      alert("Item name and quantity cannot be empty.");
      return;
    }

    try {
      const res = await fetch("supplies.php?action=edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supply_id: el.dataset.id,
          item_name: newName.trim(),
          quantity: newQty.trim()
        })
      });
      const txt = await res.text();
      console.log("edit response text:", txt);
      let json;
      try { json = JSON.parse(txt); } catch (err) { throw new Error("Server returned invalid JSON: " + txt); }
      if (!json.success) throw new Error(json.error || "Edit failed");
      loadSupplyList();
    } catch (err) {
      alert("Edit failed: " + err.message);
    }
  }
});

// Search filter
document.getElementById("searchBar").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  const filtered = allSupplies.filter(s =>
    String(s.supply_id).toLowerCase().includes(term) ||
    (s.item_name || "").toLowerCase().includes(term) ||
    String(s.quantity).includes(term)
  );
  renderSupplyList(filtered);
});

// Add supply (improved diagnostics)
document.getElementById("addSupplyForm").addEventListener("submit", async e => {
  e.preventDefault();
  const supplyName = document.getElementById("supplyName").value.trim();
  const supplyQuantity = document.getElementById("supplyQuantity").value.trim();

  if (!supplyName || !supplyQuantity) {
    alert("Please fill all fields.");
    return;
  }

  try {
    const res = await fetch("supplies.php?action=add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_name: supplyName,
        quantity: supplyQuantity
      })
    });

    const text = await res.text();
    console.log("add response text:", text);

    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new Error("Server returned invalid response: " + text);
    }

    if (!json.success) throw new Error(json.error || "Add failed");
    document.getElementById("addSupplyForm").reset();
    loadSupplyList();
  } catch (err) {
    alert("Add failed: " + err.message);
    console.error("Add failed details:", err);
  }
});

// initial load
loadSupplyList();


