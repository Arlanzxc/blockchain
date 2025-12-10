// App.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0xA8eA3CE1C94F15ad16b2E9082E437C9369F2D929"; 
const ABI = [
    "function play(uint8 _myChoice) public returns (string memory)",
    "function getMyHistory() public view returns (tuple(address player, string result, uint8 playerChoice, uint8 houseChoice, uint256 timestamp)[])"
];

function App() {
  const [account, setAccount] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Ready to play");
  const [isLoading, setIsLoading] = useState(false);

  // Hook to check connection on load and listen for account changes
  useEffect(() => {
    checkIfWalletIsConnected();
    // Re-load history automatically when the account changes
    if (account) {
        loadHistory();
    }
  }, [account]); // Dependency ensures this runs when 'account' state updates

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) return;
    
    // Check if we are already connected
    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  // Function to read history from the smart contract
  const loadHistory = async () => {
    if (!account || !window.ethereum) return;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // We use the contract with the provider (read-only)
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        
        // Explicitly pass the 'from' address to ensure correct history retrieval
        const data = await contract.getMyHistory({ from: account });
        
        const cleanHistory = [...data].reverse(); 
        setHistory(cleanHistory);
    } catch (error) {
        console.error("Error loading history:", error);
    }
  };

  const playGame = async (choice) => {
    if (!account) return alert("Please connect your wallet first!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      setIsLoading(true);
      setStatus("Signing transaction...");

      const tx = await contract.play(choice);
      setStatus("Transaction sent. Waiting for confirmation...");
      
      await tx.wait();
      
      setStatus("Game finished! Updating history...");
      await loadHistory(); 
      setStatus("Ready to play again!");
    } catch (error) {
      console.error(error);
      setStatus("Transaction failed or rejected.");
    } finally {
      setIsLoading(false);
    }
  };

  const getEmoji = (num) => {
    const n = Number(num);
    if (n === 1) return "🪨";
    if (n === 2) return "📄";
    if (n === 3) return "✂️";
    return "❓";
  };
  
  const imageAssets = {
    1: "https://img.icons8.com/emoji/96/rock-emoji.png", 
    2: "https://img.icons8.com/?size=100&id=jDDj4ExfgPZV&format=png&color=000000", 
    3: "https://img.icons8.com/emoji/96/scissors-emoji.png",
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <div className="logo">CryptoRPS</div>
        <button className="connect-btn" onClick={connectWallet}>
          {account 
            ? `${account.substring(0, 6)}...${account.substring(38)}` 
            : "Connect Wallet"}
        </button>
      </header>

      {/* GAME AREA */}
      <main className="game-card">
        <h2>Choose Your Weapon</h2>
        
        <div className="choices-grid">
          <div 
            className={`choice-item ${isLoading ? 'disabled' : ''}`}
            onClick={() => !isLoading && playGame(1)}
          >
            <img src={imageAssets[1]} alt="Rock" />
          </div>
          <div 
            className={`choice-item ${isLoading ? 'disabled' : ''}`}
            onClick={() => !isLoading && playGame(2)}
          >
            <img src={imageAssets[2]} alt="Paper" />
          </div>
          <div 
            className={`choice-item ${isLoading ? 'disabled' : ''}`}
            onClick={() => !isLoading && playGame(3)}
          >
            <img src={imageAssets[3]} alt="Scissors" />
          </div>
        </div>
        
        <div className={`status-box ${isLoading ? "loader" : ""}`}>
          {status}
        </div>
      </main>

      {/* HISTORY AREA */}
      {account && (
        <section className="history-section">
          <h3 className="history-title">Battle History</h3>
          <ul className="history-list">
            {history.length === 0 ? <p style={{opacity:0.5, textAlign:"center"}}>No games yet...</p> : null}
            
            {history.map((game, index) => (
              <li key={index} className={`history-item ${game[1]}`}>
                <div className="game-info">
                  <span>You: {getEmoji(game[2])}</span>
                  <span style={{margin: "0 10px", opacity: 0.5}}>vs</span>
                  <span>PC: {getEmoji(game[3])}</span>
                </div>
                <div className="result-badge">{game[1]}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default App;