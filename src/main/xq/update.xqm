module namespace update = "http://cmsx.algorythm.de/service/update";
declare namespace s = "http://cms.algorythm.de/common/Site";

import module namespace db = "http://basex.org/modules/db";
import module namespace functx = "http://www.functx.com";
import module namespace old = "http://cms.algorythm.de/functions";

(:
  Set option UPDINDEX=true to enable incremental indexing (Not working for full-text indices)
  Set AUTOOPTIMIZE or run db:optimize to make sure index is up to date (takes long time)
:)

(: Resolves given path to node relative to parent. E.g.: *, child/el, el/@attr, el[1] :)
declare updating function update:update-path($parent as node(), $path as xs:string, $handler as function(node(), item()) as empty-sequence(), $newValue as item()*) as empty-sequence() {
  let $nextStep := functx:substring-before-if-contains($path,'/')
  let $restOfSteps := substring-after($path,'/')
  return if (contains($nextStep,'['))
    then
      let $nodeName := substring-before($nextStep,'[')
      let $pos := number(substring-before(substring-after($nextStep,'['),']'))
      let $child := $parent/*[functx:name-test(name(),$nodeName)][$pos]
      return if ($child and $restOfSteps)
        then update:update-path($child, $restOfSteps, $handler, $newValue)
        else invoke updating $handler($child, $newValue)
    else for $child in ($parent/*[functx:name-test(name(),$nextStep)],
      $parent/@*[functx:name-test(name(), substring-after($nextStep,'@'))])
        return if ($restOfSteps)
          then update:update-path($child, $restOfSteps, $handler, $newValue)
          else invoke updating $handler($child, $newValue)
};

declare updating function update:replace-node($node as node(), $newNode as item()) as empty-sequence() {
  (: fn:error(xs:QName('CMSXTEST'), $newNode/*) :)
  replace node $node with $newNode/*
};

declare updating function update:replace-value($node as node(), $newValue as item()) as empty-sequence() {
  replace value of node $node with $newValue
};

declare
%rest:path("p/{$pagePath=.+}/index.html")
%rest:query-param('prop', '{$prop}')
%rest:query-param('val', '{$value}')
%rest:POST
%output:method('text')
updating function update:update-page-value($pagePath as xs:string, $prop as xs:string, $value as xs:string) {
  (: TODO: Derive DB name from HTTP host header :)
  let $db := 'testdb'
  let $pageID := tokenize($pagePath)[last()]
  let $page := doc($db||'/cms-site.xml')/s:site//s:page[@id=$pageID]
  return if ($page)
    then if ($page[@title])
      then replace value of node $page/@title with $value
      else insert node attribute { 'title' } { $value } into $page
    else fn:error(xs:QName('CMSXPAGENOTFOUND'), 'Page not found: '||$pagePath)
};

declare
%rest:path('doc/{$contentPath=.+}')
%rest:query-param('xpath', '{$xpath}')
%rest:POST("{$value}")
%output:method('text')
(: %rest:form-param('xpath', '{$xpath}')
   %rest:form-param('value', '{$value}') :)
updating function update:update-document($contentPath as xs:string, $xpath as xs:string, $value as item()) {
  db:replace('testdb', $contentPath, $value)

  (: TODO: update xpath ! Updating values has no effect / "changes are not written back" -> isn't caused by dynamic-path call/return (tested with update-page-value), modify-path with callback also not working :)
  (:try {
    let $doc := doc($contentPath)
    let $fn := if ($value/self::text())
      then update:replace-value#2
      else update:replace-node#2
    let $alterNode := $doc/* (: old:dynamic-path($doc, $xpath) :)
    return if ($alterNode)
      then if ($value/self::text())
        then replace value of node $alterNode with $value
        else replace node $alterNode with $value/*
      else
        fn:error(xs:QName('CMSXPATHNOTFOUND'), 'Path not found: '||$xpath)
  } catch bxerr:BXDB0006 {
    fn:error(xs:QName('CMSXDOCNOTFOUND'), 'Content not found: '||$contentPath, 404)
  }:)
};