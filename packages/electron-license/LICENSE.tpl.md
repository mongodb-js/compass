<%= app_license %>

<% _.each(_.groupBy(deps, 'license'), function(d, license) {%>
This product also includes the following libraries which are covered by the <%= license %> license:
<% _.each(d, function(pkg) {%>
- <%= pkg.name %> retrieved from <%= pkg.url %><% }); %>
<% }); %>
