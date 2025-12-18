import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500">
      <ChatInterface />
    </main>
  );
}
