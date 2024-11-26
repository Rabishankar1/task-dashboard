import "./App.css";
import "@mantine/core/styles.css";
import '@mantine/dates/styles.css'; 
import { Dashboard } from "./components/Dashboard";
import { MantineProvider } from "@mantine/core";

function App() {
  return (
    <MantineProvider>
      <Dashboard />
    </MantineProvider>
  );
}

export default App;
