import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { Dock } from "./components/Dock";
import NavBar from "./components/NavBar";
import { FrameSDKProvider } from "./providers/FrameSDKContext";
import { ThemesProvider } from "./providers/ThemesProvider";
import Feeds from "./routes/Feeds";
import Landing from "./routes/Landing";

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
								<Route path="/feeds" component={Feeds} />
								<Route>404: Not Found</Route>
							</Switch>
						</main>
						<Dock />
					</FrameSDKProvider>
				</ThemesProvider>
			</QueryClientProvider>
		</div>
	);
}

export default App;
