import { useQuery } from "@tanstack/react-query";
import { isArticle, loadArticle, partFromCast } from "../../lib/article";
import type { HydratedCast } from "../../types";

/** The rest of an article, from the public Hypersnap node. A one-cast article
 *  is already complete. Disabled until the reader opens it. */
export const useArticleQuery = (cast: HydratedCast, enabled: boolean) => {
	const root = partFromCast(cast);
	const article = isArticle(root) ? root : null;
	const single = article?.chain.count === 1;
	return useQuery({
		queryKey: ["article", article?.fid, article?.hash],
		enabled: enabled && !!article && !single,
		queryFn: ({ signal }) => loadArticle(article!, signal),
		staleTime: 60_000,
	});
};
