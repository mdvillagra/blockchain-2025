type Props = {
  account: string | null;
  onConnect: () => void;
};

export default function WalletConnect({ account, onConnect }: Props) {
  return (
    <div>
      {account ? (
        <p>Conectado: {account}</p>
      ) : (
        <button onClick={onConnect}>Conectar Wallet</button>
      )}
    </div>
  );
}
