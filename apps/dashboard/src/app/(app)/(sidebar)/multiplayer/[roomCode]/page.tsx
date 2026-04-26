import dynamic from 'next/dynamic';

export const runtime = "edge";

const LobbyUI = dynamic(() => import('@/components/multiplayer-page/lobby'), { ssr: false });

const Lobby = () => {
  return <LobbyUI />;
};

export default Lobby;
