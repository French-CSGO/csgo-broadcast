// Ajust the value with the same value TIMEONLINE in your .env file !
const TIMEONLINE = 5;
const KEYFRAMEINTERVAL = 3;

document.addEventListener("DOMContentLoaded", () => {
	window.momentDurationFormatSetup(moment);

	fetch("/api/matches").then(r => r.json()).then((matches) => {
		setTimeout(() => {
			let ev = document.createEvent("HTMLEvents");
			ev.initEvent("DOMContentLoaded", false, true);
			document.dispatchEvent(ev);
		}, 15000);

		let live = matches.filter(m => Date.now() - (m.lastEdit * 1000) < (TIMEONLINE * 60 * 1000));
		let past = matches.filter(m => Date.now() - (m.lastEdit * 1000) >= (TIMEONLINE * 60 * 1000));
		
		live.sort((a,b) => (b.timestamp > a.timestamp) ? 1 : ((a.timestamp > b.timestamp) ? -1 : 0));
		past.sort((a,b) => (b.timestamp > a.timestamp) ? 1 : ((a.timestamp > b.timestamp) ? -1 : 0));

		let tbodyLive = document.getElementById("tableBodyLive");
		let tbodyPast = document.getElementById("tableBodyPast");
		[...tbodyLive.children].forEach(c => c.remove());
		[...tbodyPast.children].forEach(c => c.remove());

		// Check if matches are live
		if (live.length <= 0) {
			let empty = document.createElement("td");
			empty.innerText = "";

			let no = document.createElement("td");
			no.innerText = "No";

			let mtches = document.createElement("td");
			mtches.innerText = "matches";

			let available = document.createElement("td");
			available.innerText = "available";

			tbodyLive.appendChild(empty.cloneNode());
			tbodyLive.appendChild(empty.cloneNode());
			tbodyLive.appendChild(no);
			tbodyLive.appendChild(mtches);
			tbodyLive.appendChild(available);
			tbodyLive.appendChild(empty.cloneNode());
			tbodyLive.appendChild(empty.cloneNode());
			tbodyLive.appendChild(empty.cloneNode());
		}

		if (past.length <= 0) {
			let empty = document.createElement("td");
			empty.innerText = "";

			let no = document.createElement("td");
			no.innerText = "No";

			let mtches = document.createElement("td");
			mtches.innerText = "matches";

			let available = document.createElement("td");
			available.innerText = "available";

			let status = document.createElement("td");
			status.innerText = "No download available";

			tbodyPast.appendChild(empty.cloneNode());
			tbodyPast.appendChild(empty.cloneNode());
			tbodyPast.appendChild(no);
			tbodyPast.appendChild(mtches);
			tbodyPast.appendChild(available);
			tbodyPast.appendChild(empty.cloneNode());
			tbodyPast.appendChild(status);
		}

		for (let match of live) {
		// New line 
			let tr = document.createElement("tr");

		// Actions
			let td_Play = document.createElement("td");
			let a = document.createElement("button");
			a.type = "button"
			a.className = "btn btn-primary";
			a.textContent = 'Lancer';
			a.addEventListener('click', function() {
				exec(match.token) ;
				newElement.remove();
			});
			// Create a button to copy the console command to the client clipboard 
			const b = document.createElement('button');
			b.type = "button"
			b.className = "btn btn-primary";
			b.id = match.token;
			b.textContent = 'Commande';
			b.addEventListener('click', function() {
				copy(match.token) ;
			});

			td_Play.appendChild(a);
			td_Play.appendChild(b);

		// Teams 
			let td_Teamname = document.createElement("td");
			if (match.team1 === "TBD" || match.team2 === "TBD") {
				let a = document.createElement("button");
				a.type = "button"
				a.className = "btn btn-primary";
				a.textContent = 'Actualiser';
				a.addEventListener('click', function() {
					a.remove();
					const p = document.createElement("p")
					p.textContent = 'Patientez...';
					td_Teamname.appendChild(p);
					getTeams(match.token);
				});
				td_Teamname.appendChild(a);
			  } else {
				td_Teamname.innerText = match.team1 + " ⚡ " + match.team2;
			  }

        // Timestamp
			let td_Timestamp = document.createElement("td");
			td_Timestamp.innerText = moment(match.timestamp).format("Do MMMM YYYY - HH:mm:ss");
       
		// Map
			let td_Map = document.createElement("td");
			td_Map.className = match.map;
			// td_Map.innerText = match.map;

		// Tickrate
			let td_Tickrate = document.createElement("td");
			td_Tickrate.innerText = typeof match.tps !== "number" ? parseInt(match.tps) : match.tps;

		// Last response
			let td_Response = document.createElement("td");
			td_Response.innerText = moment.duration(Date.now() - (match.lastEdit * 1000)).format("HH:mm:ss", { trim: false });
			td_Response.id = match.lastEdit;
			td_Response.classList.add("lastResponse");

		// Viewers count
			let td_Viewers = document.createElement("td");
			td_Viewers.innerText = match.viewers;

		// Status
			let td_Status = document.createElement("td");
			td_Status.innerText = Date.now() - (match.lastEdit * 1000) > (60 * 1000) ? "OFFLINE" : "🔴 LIVE";

			tr.appendChild(td_Play);
			tr.appendChild(td_Teamname);
			tr.appendChild(td_Timestamp);
			tr.appendChild(td_Map);
			tr.appendChild(td_Tickrate);
			tr.appendChild(td_Response);
			tr.appendChild(td_Viewers);
			tr.appendChild(td_Status);

			tbodyLive.appendChild(tr);
		}

		for (let match of past) {
			let tr = document.createElement("tr");

			let td_Teamname = document.createElement("td");
			if (match.team1 === undefined || match.team2 === undefined) {
				td_Teamname.innerText = "TBD";
			  } else {
				td_Teamname.innerText = match.team1 + " ⚡ " + match.team2;
			  }

			let td_Play = document.createElement("td");
			td_Play.innerHTML = `<span class="badge bg-secondary">${match.token}</span>`;

			let td_Timestamp = document.createElement("td");
			td_Timestamp.innerText = moment(match.timestamp).format("Do MMMM YYYY - HH:mm:ss");

			// Carte
			let td_Map = document.createElement("td");
			td_Map.className = match.map;
			// td_Map.innerText = match.map;

			let td_Tickrate = document.createElement("td");
			td_Tickrate.innerText = typeof match.tps !== "number" ? parseInt(match.tps) : match.tps;

			let td_Response = document.createElement("td");
			td_Response.innerText = moment.duration(Date.now() - (match.lastEdit * 1000)).format("HH:mm:ss", { trim: false });
			td_Response.id = match.lastEdit;
			td_Response.classList.add("lastResponse");

			let td_Status = document.createElement("td");
			// Run with CS:GO
			let a = document.createElement("button");
			a.type = "button"
			a.className = "btn btn-primary";
			a.textContent = 'Lancer';
			a.addEventListener('click', function() {
				exec(match.token) ;
			});
			// Create a button to copy the console command to the client clipboard 
			const b = document.createElement('button');
			b.type = "button"
			b.className = "btn btn-primary";
			b.id = match.token;
			b.textContent = 'Commande';
			b.addEventListener('click', function() {
				copy(match.token) ;
			});

			// Length of the replay
			let td_duree = document.createElement("td");
			let minutes = document.createElement("span");
			minutes.textContent = `${parseInt((match.FullCount * KEYFRAMEINTERVAL) / 60)} min`;
			td_duree.appendChild(minutes);

			if (match.admin) {
				console.log("admin")
				const d = document.createElement('button');
				d.type = "button"
				d.className = "btn btn-warning";
				d.id = match.token;
				d.textContent = '🗑️';
				d.addEventListener('click', function() {
					const http = new DeleteHTTP;
					http.delete(`/admin/delete/${match.token}`)
					// Resolving promise for response data
						.then(data => {
							console.log(data)
							
						})
					// Resolving promise for error
					.catch(err => console.log(err));
				});
				td_duree.appendChild(d);
			} 

			td_Status.appendChild(a);
			td_Status.appendChild(b);

			tr.appendChild(td_Play);
			tr.appendChild(td_Teamname);
			tr.appendChild(td_Timestamp);
			tr.appendChild(td_Map);
			tr.appendChild(td_Tickrate);
			tr.appendChild(td_Response);
			tr.appendChild(td_Status);
			tr.appendChild(td_duree);

			tbodyPast.appendChild(tr);
		}
	});
});

setInterval(() => {
	let lastResponses = [...document.getElementsByClassName("lastResponse")];
	lastResponses.forEach((elem) => {
		elem.innerText = moment.duration(Date.now() - (parseInt(elem.id) * 1000)).format("HH:mm:ss", { trim: false });

		if (elem.parentElement.lastElementChild.id === "tableBodyLive") {
			elem.parentElement.lastElementChild.textContent = Date.now() - (parseInt(elem.id) * 1000) > (60 * 1000) ? "OFFLINE" : "🔴 LIVE";
		}
	});
}, 250);

// Function to copy to clipboard
function copy(id) {
	const bouton = document.getElementById(id);
	const texteOriginal = bouton.textContent;
    bouton.textContent = 'Copié !';
    
	var copyText = 'playcast "' + window.location.origin + '/match/' + id + '"';
	// Copy the text 
	navigator.clipboard.writeText(copyText)
        .then(() => {
            console.log('Texte copié dans le presse-papiers');
        })
        .catch((err) => {
            console.error('Erreur lors de la copie du texte dans le presse-papiers: ', err);
        });
	setTimeout(function() {
		bouton.textContent = texteOriginal;
	}, 5000);
	// Alert the text
	// alert(copyText);
}

// Function to run CS:GO and exec playcast
function exec(id) {
	const link = "steam://rungame/730/76561202255233023/+playcast%20%22" + window.location.origin + "/match/" + id + "%22";
	window.open(link, "_self");
}

//
function getTeams(id) {
	fetch(`/admin/getTeamsName/${id}`).then(r => r.json()).then((res) => { console.log(res) });
}

// Remove old or bad replay
class DeleteHTTP {
    async delete(url) {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-type': 'application/json'
            }
        });
        // Awaiting for the resource to be deleted
        const resData = 'Resource deleted...';
        // Return response data 
        return resData;
    }
}