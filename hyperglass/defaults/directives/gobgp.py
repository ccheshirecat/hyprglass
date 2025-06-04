"""Default GoBGP Directives."""

# Project
from hyperglass.models.directive import (
    Text,
    RuleWithIPv4,
    RuleWithIPv6,
    RuleWithPattern,
    BuiltinDirective,
)

__all__ = (
    "GoBGP_BGPASPath",
    "GoBGP_BGPCommunity",
    "GoBGP_BGPRoute",
    "GoBGP_Ping",
    "GoBGP_Traceroute",
)

NAME = "GoBGP"
PLATFORMS = ["gobgp"]

GoBGP_BGPRoute = BuiltinDirective(
    id="__hyperglass_gobgp_bgp_route__",
    name="BGP Route",
    rules=[
        RuleWithIPv4(
            condition="0.0.0.0/0",
            action="permit",
            command="gobgp global rib -a ipv4-unicast {target}",
        ),
        RuleWithIPv6(
            condition="::/0",
            action="permit",
            command="gobgp global rib -a ipv6-unicast {target}",
        ),
    ],
    field=Text(description="IP Address, Prefix, or Hostname"),
    platforms=PLATFORMS,
)

GoBGP_BGPASPath = BuiltinDirective(
    id="__hyperglass_gobgp_bgp_aspath__",
    name="BGP AS Path",
    rules=[
        RuleWithPattern(
            condition="*",
            action="permit",
            commands=[
                'gobgp global rib -a ipv4-unicast | grep -E "{target}"',
                'gobgp global rib -a ipv6-unicast | grep -E "{target}"',
            ],
        )
    ],
    field=Text(description="AS Path Regular Expression"),
    platforms=PLATFORMS,
)

GoBGP_BGPCommunity = BuiltinDirective(
    id="__hyperglass_gobgp_bgp_community__",
    name="BGP Community",
    rules=[
        RuleWithPattern(
            condition="*",
            action="permit",
            commands=[
                'gobgp global rib -a ipv4-unicast | grep "{target}"',
                'gobgp global rib -a ipv6-unicast | grep "{target}"',
            ],
        )
    ],
    field=Text(description="BGP Community String"),
    platforms=PLATFORMS,
)

GoBGP_Ping = BuiltinDirective(
    id="__hyperglass_gobgp_ping__",
    name="Ping",
    rules=[
        RuleWithIPv4(
            condition="0.0.0.0/0",
            action="permit",
            command="ping -4 -c 5 -I {source4} {target}",
        ),
        RuleWithIPv6(
            condition="::/0",
            action="permit",
            command="ping -6 -c 5 -I {source6} {target}",
        ),
    ],
    field=Text(description="IP Address, Prefix, or Hostname"),
    platforms=PLATFORMS,
)

GoBGP_Traceroute = BuiltinDirective(
    id="__hyperglass_gobgp_traceroute__",
    name="Traceroute",
    rules=[
        RuleWithIPv4(
            condition="0.0.0.0/0",
            action="permit",
            command="traceroute -4 -w 1 -q 1 -s {source4} {target}",
        ),
        RuleWithIPv6(
            condition="::/0",
            action="permit",
            command="traceroute -6 -w 1 -q 1 -s {source6} {target}",
        ),
    ],
    field=Text(description="IP Address, Prefix, or Hostname"),
    platforms=PLATFORMS,
)
