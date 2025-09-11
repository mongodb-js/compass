import { sheet } from '@leafygreen-ui/emotion';
/**
 * Emotion will dynamically decide which style insertion method to use based on
 * the "env" it is built for: in "development" mode it uses a method of
 * inserting literal style tags with css as text inside of them for every `css`
 * method call to apply styles to the page. This method is really slow, every
 * single style tag insertion causes style recalculation that can end up
 * blocking the main thread for multiple seconds, when accumulated this can
 * result in minutes of unresponsive page behavior. In "production" mode the
 * style insertion is done using a modern JS API that doesn't result in such
 * drastic performance issues.
 *
 * Specifically when embedding compass-web in mms, there is a massive
 * performance hit that can be observed when emotion is not running in "speedy"
 * mode, so to work around that we are always forcing emotion to enable it.
 *
 * Historically "speedy" mode was only active in production because editing
 * styles in the browser devtools didn't work otherwise, nowadays there is no
 * reason to not use it always, so there should be no downsides to doing this.
 * 
 * See also https://github.com/10gen/compass-data-explorer/pull/11 where we
 * already ran into a similar issue.
 */
sheet.speedy(true);
