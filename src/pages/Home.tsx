import Navbar from "../components/Navbar";

function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {" "}
      <Navbar />
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-anton text-4xl"></h1>
      </section>
    </main>
  );
}

export default Home;
