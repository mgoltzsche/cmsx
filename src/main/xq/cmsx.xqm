module namespace cmsx = "http://cmsx.algorythm.de/cmsx/renderer";
declare default element namespace "http://www.w3.org/1999/xhtml";
declare namespace s = "http://cms.algorythm.de/common/Site";

(: ATTRINDEX option must be set to true (default) to efficiently resolve pages by ID :)

declare function cmsx:page($site as node(), $pageID as xs:string*) as node()* {
  if ($pageID)
    then $site//s:page[@id=$pageID]
    else $site
};

declare function cmsx:build-url($page as node(), $urlPrefix as xs:string) as xs:string {
  $urlPrefix || fn:string-join(for $parent in $page/ancestor-or-self::s:page
    return $parent/@id/string(), '/')||'/index.html'
};

declare function cmsx:relative-root-path($path as xs:string) as xs:string {
  fn:string-join(for $i in 1 to count(fn:tokenize($path, '/')) return '../', '')
};

declare function cmsx:page-title($page as node(), $content as node()) as xs:string {
  if ($page/@title/string())
    then $page/@title/string()
    else ($content/@title/string(), $page/@id/string())[1]
};

declare function cmsx:page-title($page as node()) as xs:string {
  if ($page/@title)
    then $page/@title/string()
    else (cmsx:page-content($page)/@title/string(), $page/@id/string())[1]
};

declare function cmsx:page-content($page as node()) as node() {
  if ($page/@src)
      (: Could be faster if DB would be accessed directly (by deriving DB name from HTTP host header?!) :)
      then doc(cmsx:resolve-content-path($page/@src))/*
      else if ($page/s:content)
        then $page/s:content
        else <undefined-content />
};

declare function cmsx:resolve-content-path($node as node()) as xs:string {
  let $uriSegments := tokenize(base-uri($node), '/')
  let $baseUriSegments := remove($uriSegments, count($uriSegments))
  return string-join($baseUriSegments, '/') || '/' || $node/string()
};

declare function cmsx:render-page-content($site as node(), $page as node()) as node() {
  let $renderer := if ($page/@renderer)
    then (fn:function-lookup(xs:QName($page/@renderer/string()), 1), 'renderer: '||$page/@renderer/string())[1]
    else if ($site/@default-renderer)
      then (fn:function-lookup(xs:QName($site/@default-renderer/string()), 1), 'default-renderer: '||$site/@default-renderer/string())[1]
      else cmsx:render-page-html-content#1
  return $renderer($page)
};

declare function cmsx:render-page-html-content($page as node()) as node() {
  let $doc := cmsx:page-content($page)
  return <div class="cmsx-richedit" data-cmsx-doc="{$page/@src/string()}" data-cmsx-xpath="*">
    {$doc}
  </div>
};

declare function cmsx:xslt-transform-cms-content($page as node()) as node() {
  let $param := $page/@param/string()
  let $xslt := if ($param)
    then $param
    else 'http://cmsx.algorythm.de/cmsx/html/Components.xsl'
  return fn:transform(map{
    'source-node': cmsx:page-content($page),
    'stylesheet-location': $xslt,
    'stylesheet-params': map {
    	xs:QName('doc'): cmsx:resolve-content-path($page/@src)
    }
  })(fn:QName('', 'output')) (: TODO: make xs:QName('output') also work :)
};

declare function cmsx:default-theme($site as node(), $page as node(), $urlPrefix as xs:string) as node() {
  let $title := cmsx:page-title($page)
  let $pageNav := cmsx:html-subnavigation($page, $urlPrefix)
  return <html>
    <head>
      <title>{$title}</title>
      <link rel="stylesheet" href="//cdn.jsdelivr.net/medium-editor/5.22.0/css/medium-editor.min.css" type="text/css" media="screen" charset="utf-8" />
      <link rel="stylesheet" href="{$urlPrefix}../resources/css/default-theme.min.css" />
      <script type="text/javascript" src="{$urlPrefix}../resources/js/cmsx-0.0.1.min.js"></script>
    </head>
    <body>
      <a href="{$urlPrefix}index.html">{$site/@title/string()}</a>
      <h1 id="cmsx-page-title">{$title}</h1>
      <nav>
        {cmsx:html-navigation($site, $page, $urlPrefix)}
      </nav>
      <nav>
        {cmsx:html-breadcrumbs($page, $urlPrefix)}
      </nav>
      {$pageNav}
      <div>
        {cmsx:render-page-content($site, $page)}
      </div>
    </body>
  </html>
};

declare function cmsx:html-navigation($parentPage as node(), $currentPage as node(), $urlPrefix as xs:string) as node()* {
  if ($parentPage/*)
    then
      <ul>
        {for $child in $parentPage/s:page[empty(@nav-exclude) or xs:boolean(@nav-exclude) = false()]
            return
              <li>
                <a href="{cmsx:build-url($child, $urlPrefix)}" class="{if ($currentPage = $child) then 'active' else ''}">
                  {cmsx:page-title($child)}
                </a>
              </li>}
      </ul>
    else
      ()
};

declare function cmsx:html-breadcrumbs($page as node(), $urlPrefix as xs:string) as node()* {
  for $parent in $page/ancestor-or-self::s:page
    return <a href="{cmsx:build-url($parent, $urlPrefix)}">{cmsx:page-title($parent)}</a>
};

declare function cmsx:html-subnavigation($page as node(), $urlPrefix as xs:string) as node()* {
  if ($page/self::s:page[empty(@nav-hide) or xs:boolean(@nav-hide) = false()])
   then if ($page/s:page)
    then
      <nav>
        {cmsx:html-navigation($page, $page, $urlPrefix)}
      </nav>
    else if ($page/parent::s:page)
      then
        <nav>
          {cmsx:html-navigation($page/.., $page, $urlPrefix)}
        </nav>
      else ()
  else ()
};

(: example method for function-lookup in renderer content attribute :)
declare function cmsx:generate-start-page($page as node()) as node() {
  <p>some generated content</p>
};

declare function cmsx:http-header($statusCode as xs:integer, $contentType as xs:string, $contentLanguage as xs:string) {
  <rest:response>
    <http:response status="{$statusCode}">
      <http:header name="Content-Type" value="{$contentType}"/>
      <http:header name="Content-Language" value="{$contentLanguage}"/>
    </http:response>
  </rest:response>
};

declare
%rest:path("/p")
%rest:GET
function cmsx:render-start-page-redirect() {
  <rest:redirect>/p/index.html</rest:redirect>
};

declare
%rest:path("/p/index.html")
%rest:GET
%output:method("xhtml")
%output:omit-xml-declaration("yes")
function cmsx:render-html-page() {
  cmsx:render-html-page('')
};

declare
%rest:GET
%rest:path("/p/{$path=.+}/index.html")
%output:method("xhtml")
%output:omit-xml-declaration("no")
%output:doctype-public("-//W3C//DTD XHTML 1.0 Transitional//EN")  
%output:doctype-system("http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd")
function cmsx:render-html-page($path as xs:string) {
  let $urlPrefix := cmsx:relative-root-path($path)
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $theme := if ($site/@theme/string())
    then (fn:function-lookup(xs:QName($site/@theme/string()), 3), 'theme: '||$site/@theme/string())[1]
    else cmsx:default-theme#3
  let $pathSegments := fn:tokenize($path, '/')
  let $page := cmsx:page($site, $pathSegments[last()])
  return if ($page)
    then (
      let $pageUrl := cmsx:build-url($page, '')
      return if ($pageUrl != $path||'/index.html')
        (: Redirect to correct path when page ID found but path incorrect :)
        then <rest:redirect>{cmsx:build-url($page, $urlPrefix)}</rest:redirect>
        else (
          (: Show requested page :)
          cmsx:http-header(200, 'text/html; charset=UTF-8', 'en'),
          $theme($site, $page, $urlPrefix)
        )
    ) else (
      (: Show 404 page :)
      let $linkPage := (for $segment in fn:reverse($pathSegments) return cmsx:page($site, $segment), $site)[1]
      let $linkUrl := cmsx:build-url($linkPage, $urlPrefix)
      let $content := <s:error title="Not found">
          <s:content>
            <a href="{$linkUrl}">Next matching page</a>
          </s:content>
        </s:error>
      return (
        cmsx:http-header(404, 'text/html; charset=UTF-8', 'en'),
        $theme($site, $content, $urlPrefix)
      )
    )
};