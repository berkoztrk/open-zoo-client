import React, { useState } from 'react';
import axios from 'axios';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Autocomplete from '@material-ui/lab/Autocomplete';

import 'react-notifications/lib/notifications.css';
import {
  NotificationContainer,
  NotificationManager,
} from 'react-notifications';

import './styles.css';
import { ethers } from 'ethers';

import { FantomNFTConstants } from '../../constants/smartcontracts/fnft.constants';
import SCHandlers from '../../utils/sc.interaction';
import IPFSConstants from '../../constants/ipfs.constants';

const useStyles = makeStyles(() => ({
  container: {
    width: '40%',
    height: '80%',
    background: 'white',
    position: 'fixed',
    right: '36px',
    top: '12%',
  },
  inkContainer: {
    borderBottom: '1px dotted blue',
  },
  inkMetadataInput: {
    margin: '24px',
    backgroundColor: '#ffffff !important',
    background: 'transparent !important',
  },
  inkButton: {
    width: '30%',
    letterSpacing: '11px',
    fontFamily: 'monospace',
    fontSize: 'x-large',
    backgroundColor: '#007bff !important',
    margin: '0 0 24px 0',
  },
  inkInputContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  inkButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inkDescriptionContainer: {
    marginTop: '40px',
    marginBottom: '40px',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  autocomplete: {
    width: '200px',
    backgroundColor: '#ffffff !important',
    background: 'transparent !important',
  },
}));

const assetCategories = [
  'Art',
  'Domain Names',
  'Virtual Words',
  'Trading Cards',
  'Collectibles',
  'Sports',
  'Utility',
  'New',
];

const Metadata = () => {
  const classes = useStyles();

  const [name, setName] = useState('fAsset');
  const [symbol, setSymbol] = useState('newnft');
  const [limit, setLimit] = useState(1);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Art');

  const createNotification = type => {
    switch (type) {
      case 'info':
        NotificationManager.info('Your asset has been successfully created');
        break;
      case 'success':
        NotificationManager.success(
          'Your asset has been successfully created',
          'Success'
        );
        break;
      case 'warning':
        NotificationManager.warning(
          'Warning message',
          'Close after 3000ms',
          3000
        );
        break;
      case 'error':
        NotificationManager.error(
          'Failed in creating your asset',
          'Error',
          5000,
          () => {
            alert('callback');
          }
        );
        break;
    }
  };

  const handleInputChange = (value, target) => {
    switch (target) {
      case 'name':
        {
          setName(value);
        }
        break;
      case 'limit':
        {
          setLimit(value);
        }
        break;
      case 'description':
        {
          setDescription(value);
        }
        break;
      case 'category':
        {
          setCategory(value);
        }
        break;
      case 'symbol':
        {
          setSymbol(value);
        }
        break;
      default: {
        console.log('default');
      }
    }
  };

  const validateMetadata = address => {
    return (
      name != '' &&
      symbol != '' &&
      limit >= 1 &&
      (category != '') & (address != '')
    );
  };

  const connectWallet = async () => {
    await window.ethereum.enable();
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    let accounts = await provider.listAccounts();
    return accounts[0];
  };

  const mintNFT = async () => {
    let address = await connectWallet();
    console.log('created from ', address);
    if (!validateMetadata(address)) {
      return;
    }
    let canvas = document.getElementById('drawingboard');
    let formData = new FormData();
    formData.append('image', canvas.toDataURL());
    formData.append('name', name);
    formData.append('limit', limit);
    formData.append('address', address);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('symbol', symbol);
    try {
      let result = await axios({
        method: 'post',
        url: 'http://localhost:5000/ipfs/uploadImage2Server',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileHash = result.data.fileHash;
      const jsonHash = result.data.jsonHash;

      console.log('file hash is ', fileHash, ' json hash is ', jsonHash);

      let status = result.data.status;

      console.log('status is ', status);

      console.log('address is ', address);
      let fnft_sc = await SCHandlers.loadContract(
        FantomNFTConstants.TESTNETADDRESS,
        FantomNFTConstants.ABI
      );

      console.log('fnft sc is ', fnft_sc);

      try {
        let tokenId = await fnft_sc.mint(
          address,
          IPFSConstants.HashURI + jsonHash + '/',
          {
            gasLimit: 3000000,
          }
        );
        console.log('new nft has been created, token id is ', tokenId);
        switch (status) {
          case 'success':
            {
              createNotification('info');
            }
            break;
          case 'failed':
            {
              createNotification('error');
            }
            break;
          default: {
            console.log('default status');
          }
        }
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      createNotification('error');
    }
  };

  return (
    <div className={classes.container}>
      <NotificationContainer />
      <div className={classes.inkContainer}>
        <div className={classes.inkInputContainer}>
          <TextField
            className={classes.inkMetadataInput}
            label="Name"
            id="inkmetadatanameinput"
            value={name}
            onChange={e => {
              handleInputChange(e.target.value, 'name');
            }}
          />
          <TextField
            className={classes.inkMetadataInput}
            label="Symbol"
            id="inkmetadatasymbolinput"
            value={symbol}
            onChange={e => {
              handleInputChange(e.target.value, 'symbol');
            }}
          />
          <TextField
            className={classes.inkMetadataInput}
            label="Limit"
            type="number"
            id="inkmetadatalimitinput"
            value={limit}
            onChange={e => {
              handleInputChange(e.target.value, 'limit');
            }}
            InputProps={{
              inputProps: {
                min: 1,
              },
            }}
          />
          <Autocomplete
            id="category-combo-box"
            options={assetCategories}
            getOptionLabel={option => {
              handleInputChange(option, 'category');
              return option;
            }}
            className={classes.autocomplete}
            renderInput={params => (
              <TextField
                {...params}
                className={classes.inkMetadataInput}
                label="Categories"
                id="inkmetadatacategoryinput"
              />
            )}
          />
        </div>
        <div className={classes.inkDescriptionContainer}>
          <TextField
            label="description(Optional)"
            style={{ textAlign: 'left' }}
            hinttext="Message Field"
            defaultValue={description}
            floatinglabeltext="MultiLine and FloatingLabel"
            multiline
            rows={2}
            onChange={e => {
              handleInputChange(e.target.value, 'description');
            }}
          />
        </div>
        <div className={classes.inkButtonContainer}>
          <Button
            variant="contained"
            color="primary"
            className={classes.inkButton}
            onClick={mintNFT}
          >
            Ink
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Metadata;