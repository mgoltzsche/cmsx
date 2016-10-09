module namespace p = "http://cmsx.algorythm.de/service/page";
declare namespace s = "http://cms.algorythm.de/common/Site";

declare
%rest:GET
%rest:path("/p/index.service")
%output:method("json")
function p:get-page() {
  p:get-page('')
};

declare
%rest:GET
%rest:path("/p/{$path=.+}/index.service")
%output:method("json")
function p:get-page($path as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $pageID := fn:tokenize($path, '/')[last()]
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := if ($pageID)
    then $site//s:page[@id=$pageID]
    else $site
  return if ($page)
    then (
      let $pageChildren := map {
        'parents': array {for $parent in $page/ancestor::* return p:map($parent)},
        'children': array {for $child in $page/s:page return p:map($child)}
      }
      return map:merge((p:map($page), $pageChildren))
    )
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$path)
};

declare
%rest:POST("{$pageAttrs}")
%rest:path("/p/{$path=.+}/index.service")
%rest:consumes("application/json")
%output:method("json")
updating function p:update-page($path as xs:string, $pageAttrs as map(*)) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $pageID := fn:tokenize($path, '/')[last()]
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := if ($pageID)
    then $site//s:page[@id=$pageID]
    else $site
  return if ($page)
    then (
      delete nodes $page/@*,
      for $key in map:keys($pageAttrs)
        return insert node attribute { $key } { $pageAttrs($key) } into $page
    ) 
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$path) 
};

declare function p:map($page as node()) as map(*) {
  map:merge((
    for $attr in $page/@* return map { $attr/name(): $attr/string() },
    map { 'href': p:href($page) }
  ))
};

declare function p:href($page as node()) as xs:string {
  fn:string-join(for $parent in $page/ancestor-or-self::s:page return '/' || $parent/@id/string(), '')
};