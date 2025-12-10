import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

// ВСТАВЬ СЮДА АДРЕС СВОЕГО КОНТРАКТА ИЗ REMIX
const CONTRACT_ADDRESS = "0xA8eA3CE1C94F15ad16b2E9082E437C9369F2D929";

// ABI (Интерфейс) контракта
const ABI = [
	"function play(uint8 _myChoice) public returns (string memory)",
	"function getMyHistory() public view returns (tuple(address player, string result, uint8 playerChoice, uint8 houseChoice, uint256 timestamp)[])"
];

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
      loadHistory(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const loadHistory = async (account) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        const data = await contract.getMyHistory();
        setHistory([...data].reverse());
      }
    } catch (error) {
      console.log(error);
    }
  };

  const playGame = async (choice) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        setStatus("Transaction sending... Please wait.");
        const tx = await contract.play(choice);
        await tx.wait(); 
        
        setStatus("Game Finished!");
        loadHistory(currentAccount); 
      }
    } catch (error) {
      console.error(error);
      setStatus("Transaction Failed");
    }
  };

  const getEmoji = (num) => {
    if (String(num) === "1") return "🪨";
    if (String(num) === "2") return "📄";
    if (String(num) === "3") return "✂️";
    return "?";
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Rock Paper Scissors (Blockchain)</h1>
        
        {!currentAccount ? (
          <button className="connect-btn" onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <div>
            <p>Connected: {currentAccount.substring(0, 6)}...{currentAccount.substring(38)}</p>
            
            <div className="game-area">
              <h3>Choose your weapon:</h3>
              <div className="buttons">
                <button onClick={() => playGame(1)}>🪨 Rock</button>
                <button onClick={() => playGame(2)}>📄 Paper</button>
                <button onClick={() => playGame(3)}>✂️ Scissors</button>
              </div>
              <p className="status">{status}</p>
            </div>

            <div className="history-area">
              <h3>Game History</h3>
              {history.length === 0 ? <p>No games yet</p> : (
                <ul className="history-list">
                  {history.map((game, index) => (
                    <li key={index} className={`history-item ${game[1]}`}>
                       You: {getEmoji(game[2])} vs PC: {getEmoji(game[3])} — <b>{game[1]}</b>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;