<%@include file="/libs/granite/ui/global.jsp"%>
<%@page session="false"
          import="com.day.cq.commons.servlets.HtmlStatusResponseHelper,
                  org.apache.sling.api.servlets.HtmlResponse"%>
<%
    HtmlResponse htmlResponse = null;

    try {
        String eaemTitle = request.getParameter("eaemTitle");

        System.out.println("--------------" + eaemTitle);

        htmlResponse = HtmlStatusResponseHelper.createStatusResponse(true, eaemTitle, "/projects.html");

    } catch (Exception e) {
        htmlResponse = HtmlStatusResponseHelper.createStatusResponse(false, "Error handling wizard data - " + e.getMessage(), null);
    }

    htmlResponse.send(response, true);
%>