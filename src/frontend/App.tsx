import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Footer } from "./components/Footer";
import NavBar from "./components/NavBar";
import { FrameSDKProvider } from "./providers/FrameSDKContext";
import { ThemesProvider } from "./providers/ThemesProvider";
import Landing from "./routes/Landing";
import Uses from "./routes/Uses";

const queryClient = new QueryClient();

function App() {
	return (
		<div className="min-h-screen bg-base-100 flex flex-col" data-theme="dark">
			<QueryClientProvider client={queryClient}>
				<ThemesProvider>
					<FrameSDKProvider>
						<NavBar />
						<main className="flex-grow pb-16">
							<Switch>
								<Route path="/" component={Landing} />
								<Route path="/uses" component={Uses} />
								<Route>404: Not Found</Route>
							</Switch>
						</main>
						<Footer />
					</FrameSDKProvider>
				</ThemesProvider>
			</QueryClientProvider>
		</div>
	);
}

export default App;
