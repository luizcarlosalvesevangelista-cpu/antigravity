fetch("dados/itens.json").then(r => r.json()).then(d => document.getElementById("itens").textContent = d.map(x => x.nome).join(", ")).catch(() => {});
