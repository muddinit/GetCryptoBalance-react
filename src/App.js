import React, { useState } from "react";
import styled from "styled-components";
import { exampleAddresses } from "./exampleAddresses.js";
import axios from 'axios';

const theme = {
  blue: {
    default: "#3f51b5",
    hover: "#283593"
  },
  pink: {
    default: "#e91e63",
    hover: "#ad1457"
  }
};

const Button = styled.button`
  background-color: ${(props) => theme[props.theme].default};
  color: white;
  padding: 5px 15px;
  border-radius: 5px;
  outline: 0;
  text-transform: uppercase;
  margin: 10px 0px;
  cursor: pointer;
  box-shadow: 0px 2px 2px lightgray;
  transition: ease background-color 250ms;
  &:hover {
    background-color: ${(props) => theme[props.theme].hover};
  }
  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
`;

const StyledInput = styled.textarea`
  display: block;
  margin: 20px 0px;
  border: 1px solid lightblue;
  width: 520px;
  height: 300px;
  resize: none;
`;

const StyledParagraph = styled.p`
white-space: pre-line;
color: white;
`;

Button.defaultProps = {
  theme: "blue"
};

const Table = ({ headers, data }) => {
  return (
    <div>
      <table>
        <thead>
          <tr>
            {headers.map(head => (
              <th key={head}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map(e => (
                <td key={e}>{e}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function App() {

  const [value, setValue] = useState("");
  const [Log, setLog] = useState("");
  const [ButtonsState, setButtonsState] = useState([false, true, false]);
  const [TableData, setTableData] = useState([]);
  const headers = ["Вид валюты", "Баланс", "Валюта", "Адрес"];

  function MakeLog(text) {
    let x = new Date();
    setLog(previousCount => `\n${x.getHours()}:${x.getMinutes()}:${x.getSeconds()} ${text}` + previousCount);
  }

  function PutExample() {
    MakeLog('Загружен пример');
    return Object.values(exampleAddresses).join("\n");
  }

  async function GetBalanceData(value) {

    let result = [];

    async function OutputBalance(currency, currencyName, url, address) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      let balance = "";
      await axios.get(url)
        .then(response => {
          switch (currency) {
            case 'ETH': {
              balance = response.data.ETH.balance;
              break;
            }

            //Если BTC,DOGE,LTC,DASH
            default: {
              balance = response.data.final_balance / 100000000;
              break;
            }
          }
          MakeLog(`${currencyName} Адрес. Баланс равен ${balance} ${currency}`);
          result.push({ name: currencyName, balance: balance, currency: currency, address: address });
          return true;
        })
        .catch((error) => {
          if (error.response) {
            MakeLog(`Ошибка ${error.response.status}`);
          }
        });
    }

    if (value === "") {
      MakeLog(`Нет информации о адресах`);
      setButtonsState([false, true, false]);
      return false;
    }

    // Отключаем кнопки и таблицу
    setButtonsState([true, true, true]);
    setTableData([]);
    setLog('');

    let addressValues = value.split(/\r?\n/);
    for (let element of addressValues) {

      //Bitcoin
      if (element.length >= 26 || element.length <= 35) {
        if (element.startsWith('1') || element.startsWith('3') || element.startsWith('bc1')) {
          await OutputBalance('BTC', 'Bitcoin', `https://api.blockcypher.com/v1/btc/main/addrs/${element}/balance`, element);
        }
      }

      // Dogecoin
      if (element.startsWith('D') && (element[1] === element[1].toUpperCase())) {
        await OutputBalance('DOGE', 'Dogecoin', `https://api.blockcypher.com/v1/doge/main/addrs/${element}/balance`, element);
      }

      //Litecoin
      else if (element.startsWith('L') || element.startsWith('M') || element.startsWith('ltc')) {
        await OutputBalance('LTC', 'Litecoin', `https://api.blockcypher.com/v1/ltc/main/addrs/${element}/balance`, element);
      }

      //Dashcoin
      else if (element.startsWith('X')) {
        await OutputBalance('DASH', 'Dashcoin', `https://api.blockcypher.com/v1/dash/main/addrs/${element}/balance`, element);
      }

      //Ethereum
      else if (element.startsWith('0x') && element.length === 42) {
        await OutputBalance('ETH', 'Ethereum', `https://api.ethplorer.io/getAddressInfo/${element}?apiKey=freekey`, element);
      }
    }

    if (result.length !== 0) {
      setButtonsState([false, false, false]);
      setTableData(result);
    }
    else {
      MakeLog(`Нет правильных адресов`);
      setButtonsState([false, true, false]);
    }

  }

  function Save() {
    let file = [];
    file.push(headers.join());
    TableData.forEach(element => file.push(Object.values(element)));
    file = file.join("\r\n");
    file = new Blob([(file)], { type: "text/csv" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = "balance";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  
  

  return (
    <>
      <Button disabled={ButtonsState[0]} onClick={() => GetBalanceData(value)}>Получить баланс</Button>
      <Button disabled={ButtonsState[1]} onClick={() => Save(TableData)}>Сохранить как .csv</Button>
      <Button disabled={ButtonsState[2]} onClick={() => setValue(PutExample())}>Пример</Button>
      <StyledInput placeholder="Введите адреса..." value={value} onChange={e => setValue(e.target.value)} />
	  <div style={{color: "white"}}>
      {TableData.length !== 0 ? (<Table headers={headers} data={TableData} > </Table>) : ('')}
	  </div>
	  <StyledParagraph>{Log}</StyledParagraph>
    </>
  );

}