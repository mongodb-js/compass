import './mode';
import * as theme from './theme';

if ((module as any).hot) {
  (module as any).hot.accept('./theme', function () {
    const styles =
      theme.mongodbAceThemeCssText +
      `\n/*# sourceURL=ace/css/${theme.mongodbAceThemeCssClass} */`;
    document
      .getElementById(theme.mongodbAceThemeCssClass)
      ?.replaceChildren(document.createTextNode(styles));
  });
}
