import React, { useState } from 'react';
import './devicePairing.css';

// Simple device pairing component. Generates a one-time 6-digit code which can be entered on the other device.
const generatePairCode = () => {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, '0');
}

const DevicePairing: React.FC = () => {
  const [code, setCode] = useState<string>(() => generatePairCode());
  const [copied, setCopied] = useState(false);

  const refresh = () => setCode(generatePairCode());
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="fd-pair">
      <h4>Pair a device</h4>
      <p>Open FarmDesk on the device to pair and enter this code or scan the QR (optional).</p>
      <div className="fd-pair__code">{code}</div>
      <div className="fd-pair__actions">
        <button className="fd-btn" onClick={copy}>{copied ? 'Copied' : 'Copy code'}</button>
        <button className="fd-btn fd-btn--alt" onClick={refresh}>New code</button>
      </div>
      <p style={{marginTop:10,color:'#666'}}>For secure pairing use the code within 10 minutes.</p>
    </div>
  )
}

export default DevicePairing;
