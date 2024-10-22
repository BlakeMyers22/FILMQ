// Global variables
let web3;
let contract;
let accounts;
const contractAddress = "0x45F149cc041c5CFa7b97CDe1EaB3E4794193f673"; // Replace with actual contract address
const contractABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "filmDetails",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "budget",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string[]",
				"name": "mediaUrls",
				"type": "string[]"
			}
		],
		"name": "FilmTokenized",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_filmDetails",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_budget",
				"type": "uint256"
			},
			{
				"internalType": "string[]",
				"name": "_mediaUrls",
				"type": "string[]"
			}
		],
		"name": "tokenizeFilm",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "filmCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "films",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "filmDetails",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "budget",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_filmId",
				"type": "uint256"
			}
		],
		"name": "getFilm",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "filmDetails",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "budget",
						"type": "uint256"
					},
					{
						"internalType": "string[]",
						"name": "mediaUrls",
						"type": "string[]"
					}
				],
				"internalType": "struct Filmdaq.Film",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getFilmCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Pinata API keys for IPFS
const pinataApiKey = 'af14f0ce62376c2fbdf5';
const pinataSecretApiKey = '7bef7ab2b213c20e20f31e0349736ac3eab3b64c983d4dcb95772d79f2f64758';

// Connect Wallet function
async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.enable();
            accounts = await web3.eth.getAccounts();
            document.getElementById('walletAddress').innerText = `Wallet Address: ${accounts[0]}`;
            loadContract();
            document.getElementById('tokenizeFilmSection').style.display = 'block';
        } catch (error) {
            console.error('User denied account access');
        }
    } else {
        alert('Please install MetaMask');
    }
}

// Load the contract
function loadContract() {
    contract = new web3.eth.Contract(contractABI, contractAddress);
}

// Pinata: Upload file to IPFS
async function uploadToIPFS(file) {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    let data = new FormData();
    data.append('file', file);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${btoa(pinataApiKey + ':' + pinataSecretApiKey)}`,
        },
        body: data
    });

    if (response.ok) {
        const json = await response.json();
        return `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;
    } else {
        throw new Error('Failed to upload file to IPFS');
    }
}

// Tokenize Film function
async function tokenizeFilm() {
    const filmDetails = document.getElementById('filmDetailsInput').value;
    const budget = document.getElementById('budgetInput').value;

    if (!filmDetails || !budget) {
        alert('Please enter film details and budget.');
        return;
    }

    // Upload media files to IPFS
    const mediaFiles = document.getElementById('mediaInput').files;
    if (mediaFiles.length === 0) {
        alert('Please upload at least one image or video.');
        return;
    }

    const mediaUrls = [];
    for (let i = 0; i < mediaFiles.length; i++) {
        const url = await uploadToIPFS(mediaFiles[i]);
        mediaUrls.push(url);
    }

    // Store film details and media URLs in the contract
    try {
        await contract.methods.tokenizeFilm(filmDetails, budget, mediaUrls).send({ from: accounts[0] });
        alert('Film tokenized successfully!');
    } catch (error) {
        console.error('Error tokenizing film:', error);
        alert('Error tokenizing film.');
    }
}

// Get Tokenized Films function
async function getTokenizedFilms() {
    const filmListContainer = document.getElementById('filmList');
    filmListContainer.innerHTML = '';

    try {
        const filmCount = await contract.methods.getFilmCount().call();

        for (let i = 1; i <= filmCount; i++) {
            const film = await contract.methods.getFilm(i).call();
            const filmCard = document.createElement('div');
            filmCard.className = 'film-card';
            filmCard.innerHTML = `
                <h3>${film.filmDetails}</h3>
                <p><strong>Budget:</strong> ${film.budget} FILMQ</p>
                <div class="media-container">
                    ${film.mediaUrls.map(url => {
                        if (url.endsWith('.jpg') || url.endsWith('.png')) {
                            return `<img src="${url}" alt="Film Image">`;
                        } else if (url.endsWith('.mp4')) {
                            return `<video src="${url}" controls></video>`;
                        }
                        return '';
                    }).join('')}
                </div>
            `;
            filmListContainer.appendChild(filmCard);
        }

    } catch (error) {
        console.error('Error fetching tokenized films:', error);
    }
}

// Event listeners
document.getElementById('connectWalletButton').addEventListener('click', connectWallet);
document.getElementById('tokenizeFilmButton').addEventListener('click', tokenizeFilm);
window.onload = getTokenizedFilms; // Load tokenized films when page loads
