// Necessary imports
import { ethers, providers } from "ethers";
import { useState, useEffect } from "react";
import { Button, Form, Container, Image, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import banner from "./banner.png";
const contractABI = [
  {
    inputs: [
      { internalType: "string[]", name: "wordCategories", type: "string[]" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "submitter",
        type: "address"
      },
      {
        indexed: false,
        internalType: "string[]",
        name: "phrase",
        type: "string[]"
      }
    ],
    name: "PhraseSubmitted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string", name: "word", type: "string" },
      {
        indexed: true,
        internalType: "address",
        name: "submitter",
        type: "address"
      }
    ],
    name: "UniqueWordAdded",
    type: "event"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "categories",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "categoryWords",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getPhraseByAddress",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "word", type: "string" }],
    name: "getUniqueWordSubmitter",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "category", type: "string" }],
    name: "getWordByAddressAndCategory",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "category", type: "string" }],
    name: "getWordsByCategory",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "isWordSubmitted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "isWordUnique",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "phrases",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string[]", name: "phrase", type: "string[]" }],
    name: "submitPhrase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "uniqueWordSubmitters",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "uniqueWords",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "string", name: "", type: "string" }
    ],
    name: "words",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
];
const contractAddress = "0x930f316c6315B83CDBB05148695b307986781599";

const App = () => {
  const [phrase, setPhrase] = useState([]);
  const [categories, setCategories] = useState([
    "Location",
    "Color",
    "Noun",
    "Name of a well known person on AVAX",
    "Verb",
    "Verb ending in -ing",
    "Object",
    "Shape",
    "2nd Color"
  ]);
  const [account, setAccount] = useState(null);

  // Define the necessary state
  const [publicKey, setPublicKey] = useState();
  const [network, setNetwork] = useState();
  const [chainId, setChainId] = useState();
  const [msg, setMsg] = useState();

  // When the component is first mounted, check if there's an Ethereum wallet already connected
  useEffect(() => {
    // If the ethereum object and a selected address are available...
    if (window.ethereum && window.ethereum.selectedAddress) {
      // Then we can go ahead and set the account.
      setAccount(window.ethereum.selectedAddress);
    }
  }, []); // This effect should only run on component mount, hence the empty dependency array.

  // Define the function for the "Connect Wallet" button
  const connectWallet = async () => {
    const { ethereum } = window;
    if (ethereum && ethereum.isMetaMask) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const { name, chainId } = await provider.getNetwork();
      setNetwork(name);
      setChainId(chainId);
      setPublicKey(accounts[0]);
      // Also set the account in your state after it's been connected.
      setAccount(accounts[0]);
      // switch to Avalanche upon connection
      await switchNetwork(43114);
    } else {
      setMsg("Please install MetaMask");
    }
  };

  // Define the function for the "Submit Phrase" button
  const submitPhrase = async () => {
    if (window.ethereum && publicKey) {
      // This will be injected by Metamask or a similar wallet
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      let contract = new ethers.Contract(contractAddress, contractABI, signer);

      try {
        let transaction = await contract.submitPhrase(phrase);
        console.log(transaction);
        window.alert("Transaction has been submitted successfully!"); // Alert on successful submission
      } catch (error) {
        console.log(error);
        window.alert("There was an error submitting your transaction."); // Alert on error
      }
    } else {
      alert("Please connect your Metamask wallet");
    }
  };

  // Define the function for switching networks
  const switchNetwork = async (chainId) => {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [avlNetwork[`${chainId}`]]
      });
      setNetwork(avlNetwork[`${chainId}`].chainName);
      setChainId(chainId);
    } catch (error) {
      setMsg(error);
    }
  };

  const placeholderTexts = {
    Location: "e.g. back of a movie theater",
    Color: "e.g. magenta",
    Noun: "a person, place or thing",
    "Name of a well known person on AVAX": "e.g. Harrowed Wrath",
    Verb: "an action (e.g. pump)",
    "Verb ending in -ing": "e.g. dumping",
    Object: "e.g. hard drive",
    Shape: "e.g. cloud shape, pear shape, etc.",
    "2nd Color": "different than the 1st color"
  };

  // The avlNetwork object
  const avlNetwork = {
    137: {
      chainId: `0x${Number(137).toString(16)}`,
      rpcUrls: ["https://rpc-mainnet.matic.network/"],
      chainName: "Polygon Mainnet",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18
      },
      blockExplorerUrls: ["https://polygonscan.com/"]
    },
    43114: {
      chainId: `0x${Number(43114).toString(16)}`,
      rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
      chainName: "Avalanche C-Chain",
      nativeCurrency: {
        name: "Avalanche",
        symbol: "AVAX",
        decimals: 18
      },
      blockExplorerUrls: ["https://snowtrace.io/"]
    }
  };

  // Then in your return statement for the component, you can use these states:
  return (
    <Container>
      {/* Other elements */}

      <Button variant="primary" onClick={connectWallet}>
        Connect Wallet
      </Button>
      {/* If there's an account connected, show its address */}
      {account && <p>Connected account: {account}</p>}

      <Row className="justify-content-md-center">
        <Col md="auto">
          <Image src={banner} fluid />
        </Col>
      </Row>

      <h1 className="text-center">Ad Libs Submission</h1>

      <h2>How it works:</h2>
      <p>
      In this unique community building art project, you're invited to contribute words that will fill in the missing gaps to create a short story.
      <br />
      <br />
When the timeframe for word submission ends, I will pick the words that I think will create an interesting work of art and bring the piece to life primarily using AI, sentence by sentence, creating a collection of 1/1 art pieces that illustrate the story. 
<br />
<br />
As a contributor, you have the opportunity to submit your words via blockchain technology
<br />
<br />
By submitting your words for this project with a crypto wallet address, if your word submission is used for the story, your address will be part of the minting of the artwork and you will receive a royalty for your contribution.
<br />
<br />

You will also be given early access to acquiring the NFT version of the artwork before it is available to the general public. 
<br />
<br />
For static imagery, art prints will also be made available.
<br />
<br />

Thank you for participating in this novel project and I'm looking forward to seeing what we can create together!
      </p>

      <h2>Guidelines</h2>
      <p>
        Please submit your words below. The only criteria for the words are the
        following:
        <br />
        <br />
        <ul>
          <li>They need to be a real world in the English language</li>
          <br />
          <li>Profanity and R-rated words are allowed</li>
          <br />
          <li>Submitting derogatory words will disqualify your submission</li>
        </ul>
      </p>
      <br />
      <br />

      <Form>
        {categories.map((category, index) => (
          <Form.Group key={index}>
            <Form.Label>{category}</Form.Label>
            <Form.Control
              type="text"
              placeholder={placeholderTexts[category]}
              onChange={(e) => {
                let newPhrase = [...phrase];
                newPhrase[index] = e.target.value;
                setPhrase(newPhrase);
              }}
            />
          </Form.Group>
        ))}
        <Button variant="primary" onClick={submitPhrase}>
          Submit
        </Button>
      </Form>
    </Container>
  );
};

export default App;
