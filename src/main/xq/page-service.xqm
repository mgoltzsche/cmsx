module namespace p = "http://cmsx.algorythm.de/service/page";
declare namespace s = "http://cms.algorythm.de/common/Site";


declare function p:page($site, $pagePath as xs:string) as node() {
  let $pathSegments := fn:tokenize($pagePath, '/')
  let $pageName := $pathSegments[last()]
  return if ($pagePath)
    then
      let $page := $site//s:page[@id=$pageName]
      return if ($page)
        then $page
        else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$pagePath)
    else $site
};

declare
%rest:GET
%rest:path("/service/page")
%output:method("json")
function p:get-page() {
  p:get-page('')
};

declare
%rest:GET
%rest:path("/service/page/{$pagePath=.*}")
%output:method("json")
function p:get-page($pagePath as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := p:page($site, $pagePath)
  let $pageChildren := map {
    'parents': array {for $parent in $page/ancestor::* return p:map($parent)},
    'children': array {for $child in $page/s:page return p:map($child)}
  }
  return map:merge((p:map($page), $pageChildren))
};

declare
%rest:PUT("{$pageAttrs}")
%rest:path("/service/page/{$pagePath=.+}")
%rest:consumes("application/json")
updating function p:create-page($pagePath as xs:string, $pageAttrs as node()) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $pathSegments := fn:tokenize($pagePath, '/')
  let $newPageID := $pathSegments[last()]
  let $parentPageID := $pathSegments[last() - 1]
  let $parentPage := if ($parentPageID)
    then $site//s:page[@id=$parentPageID]
    else $site
  return if ($newPageID='' or $site//s:page[@id=$newPageID])
    then fn:error(xs:QName('CMSXINVALIDID'), 'Empty or duplicate page ID: '||$newPageID)
    else if ($parentPage)
      then insert node <s:page>
          {for $attr in $pageAttrs/*/child::* return attribute {$attr/name()} {$attr/text()}}
        </s:page> into $parentPage
      else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$parentPageID)
};

declare
%rest:POST("{$pageAttrs}")
%rest:path("/service/page/{$pagePath=.+}")
%rest:consumes("application/json")
updating function p:update-page($pagePath as xs:string, $pageAttrs as node()) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := p:page($site, $pagePath)
  return (
    delete nodes $page/@*,
    for $attr in $pageAttrs/*/child::*
      return insert node attribute {$attr/name()} {$attr/text()} into $page
  ) 
};

declare
%rest:DELETE
%rest:path("/service/page/{$pagePath=.+}")
updating function p:delete-page($pagePath as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := p:page($site, $pagePath)
  return if ($page)
    then delete nodes $page
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$pagePath)
};

declare
%rest:method("MOVE")
%rest:path("/service/page/{$pagePath=.+}")
%rest:header-param("Move-Context", "{$ctxPagePath}")
%rest:header-param("Move-Mode", "{$mode}", "append")
updating function p:move-page($pagePath as xs:string, $ctxPagePath as xs:string, $mode as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $site := doc($db||'/cms-site.xml')/s:site
  let $page := p:page($site, $pagePath)
  let $ctxPage := p:page($site, $ctxPagePath)
  return if ($mode = 'append')
    then (
      delete node $page,
      insert node $page as last into $ctxPage
    ) else if ($mode = 'before') then (
      delete node $page,
      insert node $page before $ctxPage
    ) else fn:error(xs:QName('CMSXINVALIDARG'), 'Invalid page move mode: '||$mode||'. Allowed: append|before')
};

declare function p:map($page as node()) as map(*) {
  map:merge((for $attr in $page/@* return map {$attr/name(): $attr/string()}))
};

declare function p:href($page as node()) as xs:string {
  fn:string-join(for $parent in $page/ancestor-or-self::s:page return '/' || $parent/@id/string(), '')
};