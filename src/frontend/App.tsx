import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import NavBar from "./components/NavBar";
import { FrameSDKProvider } from "./providers/FrameSDKContext";
import { ThemesProvider } from "./providers/ThemesProvider";
import Landing from "./routes/Landing";
import Uses from "./routes/Uses";

const queryClient = new QueryClient();

function App() {
	return (
		<div className="min-h-screen bg-base-100" data-theme="dark">
			<QueryClientProvider client={queryClient}>
				<ThemesProvider>
					<FrameSDKProvider>
						<NavBar />
						<Switch>
							<Route path="/" component={Landing} />
							<Route path="/uses" component={Uses} />
							<Route>404: Not Found</Route>
						</Switch>
					</FrameSDKProvider>
				</ThemesProvider>
			</QueryClientProvider>
		</div>
	);
}

export default App;
