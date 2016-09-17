module namespace update = "http://cmsx.algorythm.de/service/update";
declare namespace s = "http://cms.algorythm.de/common/Site";

import module namespace old = "http://cms.algorythm.de/functions";

(: Set option UPDINDEX=true to enable incremental indexing (Not working for full-text indices) :)
(: Set AUTOOPTIMIZE or run db:optimize to make sure index is up to date (takes long time) :)

declare
%rest:path("p/{$pagePath=.+}/index.html")
%rest:query-param('prop', '{$prop}')
%rest:query-param('val', '{$value}')
%rest:POST
%output:method('text')
%updating
function update:update-page-value($pagePath as xs:string, $prop as xs:string, $value as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $pageID := tokenize($pagePath)[last()]
  let $page := doc($db||'/cms-site.xml')/s:site//s:page[@id=$pageID]
  return if ($page and $value)
    then if ($page[@title])
      then replace value of node $page/@title with $value
      else insert node attribute { 'title' } { $value } into $page
    else fn:error(xs:QName('CMSXINVARG'), 'Invalid arguments')
};

declare
%rest:path('doc/{$contentPath=.+}')
%rest:query-param('xpath', '{$xpath}')
%rest:POST("{$value}")
%output:method('text')
(: %rest:form-param('xpath', '{$xpath}')
   %rest:form-param('value', '{$value}') :)
%updating
function update:update-document($contentPath as xs:string, $xpath as xs:string, $value as item()) {
  try {
    let $doc := doc($contentPath)
    let $alterNode := old:dynamic-path($doc, $xpath)
    return if ($alterNode)
      (: TODO/ATTENTION: updating copied values provided by dynamic-path has no effect :)
      then if ($value/self::text())
        then replace value of node $alterNode with $value
        else replace node $alterNode with $value/*     (: fn:error(xs:QName('CMSXTEST'), 'replace node '||$alterNode/name()||' '||$value/*/name()) :)
      else
        fn:error(xs:QName('CMSXPATHNOTFOUND'), 'Path not found: '||$xpath)
  } catch bxerr:BXDB0006 {
    fn:error(xs:QName('CMSXDOCNOTFOUND'), 'Content not found: '||$contentPath, 404)
  }
};