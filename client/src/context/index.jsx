import React,{createContext, useContext, useEffect, useRef, useState} from "react";
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { useNavigate } from 'react-router-dom';


import {ABI, ADDRESS} from '../contract'
import { createEventListeners } from "./createEventListeners";

const GlobalContext = createContext();
export const GlobalContextProvider = ({ children }) =>{
    const [walletAddress, setWalletAddress] = useState('');
    const [contract, setContract] = useState('');
    const [provider, setProvider] = useState('');
    const [showAlert, setShowAlert] = useState({status:false,type: 'info', message: ''});
    const [battleName, setBattleName] = useState('');
    const [gameData, setGameData] = useState({ players: [], pendingBattles: [], activeBattle: null });
    const [updateGameData, setUpdateGameData] = useState(0);
    const [battleGround, setBattleGround] = useState('bg-astral');


    const navigate = useNavigate();
    const updateCurrentWalletAddress = async () => {
      const accounts = await window?.ethereum?.request({ method: 'eth_accounts' });
        if (accounts){
          setWalletAddress(accounts[0]);
        }
        updateCurrentWalletAddress()
        // console.log(accounts[0]);
      };


      useEffect(() => {
        const timer= setTimeout(() => updateCurrentWalletAddress(),1000);
        // return () => clearTimeout(timer);
    
        window.ethereum.on('accountsChanged', updateCurrentWalletAddress);
        return () => clearTimeout(timer);
      }, []);
    
      //* Set the smart contract and provider to the state
      useEffect(()=>
      {
        const setSmartContracAndProvider = async () => {
          const web3Modal = new Web3Modal();
          const connection = await web3Modal.connect();
          const newProvider = new ethers.providers.Web3Provider(connection);
          const signer = newProvider.getSigner();
          const newContract = new ethers.Contract(ADDRESS,ABI,signer);

          setProvider(newProvider);
          setContract(newContract);
        }
        // setSmartContracAndProvider()
        const timer= setTimeout(() => setSmartContracAndProvider(),1000);
        return () => clearTimeout(timer);
      },[]);

       //* Activate event listeners for the smart contract
  useEffect(() => {
    if (contract) {
      createEventListeners({
        navigate,
        contract,
        provider,
        walletAddress,
        setShowAlert,
        setUpdateGameData,
      })
    }
  }, [contract])

      useEffect(() => {
        if (showAlert?.status) {
          const timer = setTimeout(() => {
            setShowAlert({ status: false, type: 'info', message: '' });
          }, [5000]);
    
          return () => clearTimeout(timer);
        }
      }, [showAlert]);

      //* Set the game data to the state
  useEffect(() => {
    const fetchGameData = async () => {
        const fetchedBattles = await contract.getAllBattles();
        // console.log(`fetch game data is = ${fetchedBattles}`);
        const pendingBattles = fetchedBattles.filter((battle) => battle.battleStatus === 0);
        // console.log(`pending battles game data is = ${pendingBattles}`);
        let activeBattle = null;

        fetchedBattles.forEach((battle) => {
          if (battle.players.find((player) => player.toLowerCase() === walletAddress.toLowerCase())) {
            if (battle.winner.startsWith('0x00')) {
              activeBattle = battle;
            }
          }
        });

        setGameData({pendingBattles: pendingBattles.slice(1), activeBattle });
    };

    if(contract) fetchGameData();
  }, [contract,updateGameData]);

    return (
        <GlobalContext.Provider 
        value={{
            contract, 
            walletAddress,
            showAlert,
            setShowAlert,
            battleName,
            setBattleName,
            gameData,
            // updateCurrentWalletAddress,
            battleGround,setBattleGround
        }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
export const  useGlobalContext = () => useContext(GlobalContext);